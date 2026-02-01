import React, { useState } from "react";
import { db, collection, addDoc } from "../api/firebase";
import classes from "./Onsite.module.css";

const Onsite = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const accountNumber = "카카오뱅크 7942-20-95501";
  const amount = 6000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "reservations"), {
        name: name.trim(),
        phone: phone.trim(),
        amount: amount,
        status: "onsite_pending",
        createdAt: new Date().toISOString(),
        description: "현장 결제"
      });
      setStep(2);
    } catch (err) {
      console.error("Submission failed:", err);
      alert("오류가 발생했습니다. 데스크에 문의해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyAccount = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(accountNumber);
        alert("계좌번호가 복사되었습니다.");
      } else {
        // Fallback for some browsers
        const textarea = document.createElement("textarea");
        textarea.value = accountNumber;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        alert("계좌번호가 복사되었습니다.");
      }
    } catch (err) {
      alert("복사에 실패했습니다.");
    }
  };

  return (
    <div className={classes.container}>
      {step === 1 ? (
        <>
          <h2 className={classes.title}>현장 예매</h2>
          <p className={classes.subtitle}>
            입금 확인을 위해 성함과 연락처를<br />
            입력해주세요.
          </p>
          <form onSubmit={handleSubmit} className={classes.form}>
            <div className={classes.inputGroup}>
              <label>입금자명</label>
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
                placeholder="01012345678"
                required
              />
            </div>
            <button
              type="submit"
              className={classes.submitBtn}
              disabled={isSubmitting}
            >
              현장 결제 확인 요청하기
            </button>
          </form>
        </>
      ) : (
        <div className={classes.successStep}>
          <h3 className={classes.successTitle}>접수되었습니다!</h3>
          <p className={classes.amount}>
            입금금액: <strong>{amount.toLocaleString()}원</strong>
          </p>

          <div className={classes.bankBox}>
            <button
              type="button"
              className={classes.bankCopyBtn}
              onClick={handleCopyAccount}
            >
              {accountNumber}
            </button>
            <p className={classes.bankOwner}>예금주 백서윤 (터치하여 복사)</p>
          </div>

          <div className={classes.appLinkBox}>
            <a href="supertoss://send?bank=카카오뱅크&accountNo=79422095501&amount=5000&origin=setup" className={`${classes.appBtn} ${classes.tossBtn}`}>
              Toss 앱 열기
            </a>
            <a href="kakaopay://home" className={`${classes.appBtn} ${classes.kakaoBtn}`}>
              카카오페이 앱 열기
            </a>
          </div>

          <p className={classes.guideText}>
            입금 후 데스크 스태프에게<br />
            입금 완료를 말씀해주세요.<br />
            확인 후 바로 입장 가능합니다.
          </p>
        </div>
      )}
    </div>
  );
};

export default Onsite;
