import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const TestimonialCard = ({
  name,
  role,
  hospital,
  content,
  image,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
      className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all"
    >
      <Quote className="w-10 h-10 text-primary-500 mb-4 opacity-50" />
      <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed italic">
        "{content}"
      </p>
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-white font-semibold text-lg">
          {name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{role}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">{hospital}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default TestimonialCard;
