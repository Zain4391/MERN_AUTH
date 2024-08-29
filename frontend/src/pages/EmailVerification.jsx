import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { verifyEmail } from "../features/authStore/authSlice";
const EmailVerification = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRef = useRef([]); // for the 6 input boxes (binds the input to the ref)
  const isLoading = false;
  const handleChange = (index, value) => {
    const newCode = [...code]; // 123

    //handle paste event
    newCode[index] = value;
    if (value.length > 1) {
      const pastedCode = value.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        newCode[i] = pastedCode[i] || "";
      }
      setCode(newCode);

      //focus on the last non-empty element or the first empty one
      const lastFilledIndex = newCode.findLastIndex((digit) => digit !== "");
      const focusIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5;
      inputRef.current[focusIndex].focus();
    } else {
      newCode[index] = value;
      setCode(newCode);

      //move focus to the next input field if value is entered
      if (value && index < 5) {
        inputRef.current[index + 1].focus();
      }
    }
  };
  const handleKeyDown = (index, e) => {
    //checks: key pressed, index (should not be less than 0) and whether the current box/input is empty
    if (e.key === "Backspace" && index > 0 && !code[index]) {
      inputRef.current[index - 1].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const verificationCode = code.join(""); //will be sent back to the API for verification

    try {
      dispatch(verifyEmail(verificationCode));
      navigate("/");
      alert("Email verification successful");
    } catch (error) {
      console.log(error);
      navigate("/signup");
    }
  };

  // Auto submit when 6 digit code has been entered. (not necessary can also use the submit button)
  useEffect(() => {
    if (code.every((digit) => digit !== "")) {
      handleSubmit(new Event("submit"));
    }
  }, [code]);
  return (
    <div className="max-w-md w-full bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl shadow-2xl p-8 w-full max-w-md"
      >
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
          Verify Your Email
        </h2>

        <p className="text-center text-gray-300 mb-6">
          Enter the 6 digit code sent to your email address
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex justify-between">
            {code.map((digit, index) => {
              return (
                <input
                  type="text"
                  key={index}
                  ref={(el) => {
                    inputRef.current[index] = el;
                  }}
                  maxLength="6"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-2xl fot-bold bg-gray-700 text-white border-2 border-gray-600 rounded-lg focus:border-green-500 focus:outline-none"
                />
              );
            })}
          </div>

          <motion.button
            className="mt-5 w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading || code.some((digit) => !digit)}
          >
            {isLoading ? "Verfying..." : "Verify"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default EmailVerification;
