import { motion } from "framer-motion";
import { ArrowLeft, Home, Search } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/Button";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <h1 className="text-9xl font-display font-bold gradient-text mb-4">
            404
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-primary-500 to-teal-500 mx-auto rounded-full mb-8" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist. It might have been
            moved or deleted.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button
                size="lg"
                variant="primary"
                icon={<Home className="w-5 h-5" />}
              >
                Back to Home
              </Button>
            </Link>
            <Link to="/detection">
              <Button
                size="lg"
                variant="outline"
                icon={<Search className="w-5 h-5" />}
              >
                Try Detection
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Error Code: 404 • Page Not Found
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;
