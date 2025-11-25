import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import catImage from "../assets/images/cat.png";

export default function Onboarding() {
  const navigate = useNavigate();

  const handleStart = () => navigate("/onboarding/flow");
  const handleSkip = () => navigate("/home");

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--color-main-bg)' }}>

      {/* 말풍선 + 고양이 */}
      <div className="relative flex flex-col items-center mb-6">
        {/* 말풍선 */}
        <motion.div
          className="bubble"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.9,
            ease: "easeOut",
            type: "spring",
            stiffness: 200,
            damping: 15
          }}
          style={{ transform: 'translateY(-15px)', marginBottom: '20px' }}
        >
          <p className="text-[white] text-lg font-[800]">=^._.^= ∫</p>
        </motion.div>

        {/* 고양이 이미지 */}
        <motion.img
          src={catImage}
          alt="Black Cat"
          className="w-[180px] sm:w-[220px] h-auto object-contain"
          initial={{ y: 30, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1
          }}
          transition={{
            duration: 1.2,
            ease: "easeOut"
          }}
        />
      </div>

      {/* 설명 */}
      <motion.div
        className="text-center leading-relaxed mb-[10px] mt-[24px]"
        style={{ color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <p className="text-[13px] sm:text-[15px] mb-[-12px]">집사님은 어떤 사람인가요?</p>
        <p className="text-[13px] sm:text-[15px] mb-[-12px]">달이에게 집사님을 소개해주세요</p>
        <p className="text-[13px] sm:text-[15px] mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          어떤 데이터도 누구에게도 전송되지 않습니다.
        </p>
      </motion.div>

      {/* 버튼 */}
      <motion.div
        className="flex flex-col items-center space-y-3 w-full max-w-xs mb-[-60px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <button onClick={handleStart} className="w-[190px] py-[13px] bg-[black] text-[white] rounded-full text-[14px] sm:text-[16px] font-semibold hover:bg-gray-900 transition-colors ">
          네, 진행할게요
        </button>
        <button onClick={handleSkip} className="text-[14px] sm:text-[16px] transition-colors bg-transparent border-none mt-[13px]" style={{ color: 'var(--color-text-primary)' }}>
          건너뛰기
        </button>
      </motion.div>

      {/* CSS */}
      <style>{`
      button {
        -webkit-appearance: none;
        appearance: none;
      }

      button.bg-black {
        background-color: #000000 !important;
        color: #ffffff !important;
      }
      .bubble {
        position: relative;
        width: 130px;
        height: 60px;
        background: #000000;
        border-radius: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
      }

      /* 꼬리  */
      .bubble::after {
        content: '';
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%) rotate(0deg);
        border-style: solid;
        border-width: 8px 8px 0;
        border-color: #000000 transparent transparent transparent;
      }


        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
