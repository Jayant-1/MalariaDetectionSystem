import { motion } from "framer-motion";

const Card = ({
  children,
  className = "",
  hover = true,
  glassmorphism = false,
  ...props
}) => {
  const baseStyles = glassmorphism ? "glass-panel rounded-xl p-6" : "card";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={
        hover ? { y: -4, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" } : {}
      }
      className={`${baseStyles} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
