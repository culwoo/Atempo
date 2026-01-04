/**
 * Atempo Cloud Functions
 *
 * 1. receiveDeposit: Accepts deposit notifications (MacroDroid -> Firebase)
 * 2. sendTicketSMS: Sends ticket email when reservation status changes to paid
 */

const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { defineSecret } = require("firebase-functions/params");
const nodemailer = require("nodemailer");

// Firebase Admin init
initializeApp();
const db = getFirestore();

// Email config (Secrets)
const GMAIL_USER = defineSecret("GMAIL_USER");
const GMAIL_APP_PASSWORD = defineSecret("GMAIL_APP_PASSWORD");
const EMAIL_FROM_NAME = defineSecret("EMAIL_FROM_NAME");
const PUBLIC_BASE_URL = defineSecret("PUBLIC_BASE_URL");

const getMailTransport = () => {
    const user = (GMAIL_USER.value() || "").trim();
    const pass = (GMAIL_APP_PASSWORD.value() || "").trim().replace(/\s+/g, "");
    if (!user || !pass) {
        throw new Error("Missing Gmail secrets. Set GMAIL_USER and GMAIL_APP_PASSWORD.");
    }
    return nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass }
    });
};

/**
 * Deposit notification API (MacroDroid -> Firebase)
 * POST /receiveDeposit
 * Body: { name: "홍길동", amount: 20000 }
 */
exports.receiveDeposit = onRequest({ cors: true, region: "asia-northeast3" }, async (req, res) => {
    // POST only
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { name, amount } = req.body || {};

        if (!name || !amount) {
            return res.status(400).json({ error: "name and amount are required" });
        }

        const normalizedAmount = String(amount).replace(/[^\d]/g, "");
        const depositAmount = parseInt(normalizedAmount, 10);
        if (!normalizedAmount || !Number.isFinite(depositAmount)) {
            return res.status(400).json({ error: "amount must be a number" });
        }

        const depositTime = new Date();

        console.log(`[Deposit] ${name} / ${depositAmount.toLocaleString()} / ${depositTime.toISOString()}`);

        // 1) Find pending reservations with same name
        const reservationsRef = db.collection("reservations");
        const snapshot = await reservationsRef
            .where("name", "==", name)
            .where("status", "==", "pending")
            .get();

        if (snapshot.empty) {
            console.log(`[Match miss] no pending reservation: ${name}`);
            return res.status(404).json({
                success: false,
                message: `No pending reservation for ${name}.`
            });
        }

        // 2) Ambiguous name handling
        if (snapshot.size > 1) {
            // Mark all as ambiguous
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, { status: "ambiguous" });
            });
            await batch.commit();

            console.log(`[Manual review] multiple pending reservations: ${name}`);
            return res.status(200).json({
                success: false,
                message: "Multiple pending reservations found. Manual review required.",
                count: snapshot.size
            });
        }

        // 3) Single match - mark paid (ignore amount)
        const targetDoc = snapshot.docs[0];

        // 4) Match success - issue token and mark paid
        const token = "t_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

        await targetDoc.ref.update({
            status: "paid",
            depositTime: depositTime.toISOString(),
            token: token
        });

        console.log(`[Match success] ${name} paid. Token: ${token}`);

        return res.status(200).json({
            success: true,
            message: `${name} reservation marked as paid.`,
            token: token
        });

    } catch (error) {
        console.error("[Error]", error);
        return res.status(500).json({ error: error.message });
    }
});

/**
 * Reservation status change -> send email
 * Firestore Trigger: reservations/{docId} document update
 */
exports.sendTicketSMS = onDocumentUpdated(
    {
        document: "reservations/{docId}",
        region: "asia-northeast3",
        secrets: [GMAIL_USER, GMAIL_APP_PASSWORD, EMAIL_FROM_NAME, PUBLIC_BASE_URL]
    },
    async (event) => {
        const beforeData = event.data.before.data();
        const afterData = event.data.after.data();

        // Only on status change to paid
        if (beforeData.status !== "paid" && afterData.status === "paid") {
            const { name, email, token } = afterData;
            const emailAttemptedAt = new Date().toISOString();

            if (!email || !token) {
                console.error("[Email fail] Missing email or token");
                await event.data.after.ref.update({
                    emailStatus: "error",
                    emailAttemptedAt,
                    emailError: "Missing email or token"
                });
                return null;
            }

            await event.data.after.ref.update({
                emailStatus: "sending",
                emailAttemptedAt,
                emailError: null,
                emailResult: null
            });

            // Ticket link
            const baseUrl = PUBLIC_BASE_URL.value() || "https://atempo.vercel.app";
            const ticketUrl = `${baseUrl.replace(/\/+$/, "")}/?auth=${token}`;

            const subject = `[Atempo] ${name}님 예약이 완료되었습니다`;
            const text = `[Atempo] ${name}님 예약이 완료되었습니다.\n\n아래 링크를 클릭하여 티켓을 확인하세요.\n${ticketUrl}`;
            const html = `
                <p><strong>Atempo</strong> ${name}님 예약이 완료되었습니다.</p>
                <p>아래 링크를 클릭하여 티켓을 확인하세요.</p>
                <p><a href="${ticketUrl}">${ticketUrl}</a></p>
            `.trim();

            try {
                const fromName = (EMAIL_FROM_NAME.value() || "Atempo").trim();
                const fromUser = (GMAIL_USER.value() || "").trim();
                const transporter = getMailTransport();

                console.log(`[Email send] ${name} (${email}) - URL: ${ticketUrl}`);
                const result = await transporter.sendMail({
                    from: `${fromName} <${fromUser}>`,
                    to: email.trim(),
                    subject,
                    text,
                    html
                });
                console.log(`[Email result] ${name} (${email})`, JSON.stringify(result));

                await event.data.after.ref.update({
                    emailStatus: "success",
                    emailSentAt: new Date().toISOString(),
                    emailResult: JSON.stringify(result)
                });
            } catch (error) {
                console.error(`[Email error] ${name} (${email})`, error);

                await event.data.after.ref.update({
                    emailStatus: "error",
                    emailError: error.message || JSON.stringify(error)
                });
            }
        }

        return null;
    }
);
