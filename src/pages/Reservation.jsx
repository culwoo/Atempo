import React, { useState } from "react";
import { db, collection, addDoc, doc, updateDoc } from "../api/firebase";
import classes from "./Reservation.module.css";

const Reservation = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1: Input, 2: Account Info
  const [reservationId, setReservationId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const accountNumber = "카카오뱅크 7942-20-95501";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      };

      if (reservationId) {
        await updateDoc(doc(db, "reservations", reservationId), {
          ...payload,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const docRef = await addDoc(collection(db, "reservations"), {
          ...payload,
          amount: 5000,
          status: "pending",
          createdAt: new Date().toISOString(),
        });
        setReservationId(docRef.id);
      }

      setStep(2);
    } catch (err) {
      console.error("Reservation failed:", err);
      alert("예약 신청 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyAccount = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(accountNumber);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = accountNumber;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      alert("계좌번호가 복사되었습니다.");
    } catch (err) {
      console.error("Failed to copy account number:", err);
      alert("복사에 실패했습니다. 계좌번호를 길게 눌러 복사해주세요.");
    }
  };

  return (
    <div className={classes.container}>
      {step === 1 ? (
        <>
          <h2 className={classes.title}>공연 예매하기</h2>
          <p className={classes.subtitle}>
            입력하신 이메일로 안내가 전송되니
            <br />
            정확히 작성해 주세요.
            <br />한 명씩 개별적으로 작성해 주세요.
          </p>
          <form onSubmit={handleSubmit} className={classes.form}>
            <div className={classes.inputGroup}>
              <label>성함 (입금자명)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 홍길동"
                required
              />
            </div>
            <div className={classes.inputGroup}>
              <label>연락처</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="예: 01012345678"
                required
              />
            </div>
            <div className={classes.inputGroup}>
              <label>이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="예: user@example.com"
                required
              />
            </div>
            <button
              type="submit"
              className={classes.submitBtn}
              disabled={isSubmitting}
            >
              {reservationId ? "정보 수정 저장하기" : "예매 신청하기"}
            </button>
          </form>
        </>
      ) : (
        <div className={classes.successStep}>
          <h3 className={classes.successTitle}>신청이 완료되었습니다!</h3>
          <div className={classes.infoBox}>
            <div className={classes.infoHeader}>
              <h4 className={classes.infoTitle}>내 정보</h4>
              <button
                type="button"
                className={classes.editBtn}
                onClick={() => setStep(1)}
              >
                내 정보 확인/수정
              </button>
            </div>
            <div className={classes.infoList}>
              <div className={classes.infoRow}>
                <span className={classes.infoLabel}>이름</span>
                <span className={classes.infoValue}>{name || "-"}</span>
              </div>
              <div className={classes.infoRow}>
                <span className={classes.infoLabel}>연락처</span>
                <span className={classes.infoValue}>{phone || "-"}</span>
              </div>
              <div className={classes.infoRow}>
                <span className={classes.infoLabel}>이메일</span>
                <span className={classes.infoValue}>{email || "-"}</span>
              </div>
            </div>
            <p className={classes.infoNotice}>
              입금 전에 정보가 맞는지 확인해주세요.
              <br />
              수정 시 기존 예약이 업데이트됩니다.
            </p>
          </div>
          <div className={classes.accountBox}>
            <button
              type="button"
              className={classes.bankNameButton}
              onClick={handleCopyAccount}
            >
              {accountNumber}
            </button>
            <p className={classes.accountName}>예금주 백서윤 (터치하여 복사)</p>
            <p className={classes.amount}>
              입금하실 금액: <strong>5,000원</strong>
            </p>
          </div>
          <p className={classes.guideText}>
            입금 시 이메일로 티켓이 발송됩니다.
          </p>
          <p className={classes.guideText}>
            이메일이 보이지 않으면 메일함에서{" "}
            <strong>4242fire@gmail.com</strong>을 검색하거나, 스팸메일함을
            확인해주세요.
          </p>
          <p className={classes.guideText}>
            📱문의: <strong>010-6352-8975</strong>
          </p>
          <p className={classes.warningText}>
            반드시 신청하신 <strong>"{name}"</strong> 입금자명으로 입금해
            주세요.
          </p>
        </div>
      )}
    </div>
  );
};

export default Reservation;
