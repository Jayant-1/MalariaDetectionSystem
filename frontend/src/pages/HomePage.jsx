import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Brain,
  CheckCircle,
  Clock,
  FileSearch,
  Globe,
  LineChart,
  Shield,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import FeatureCard from "../components/FeatureCard";
import TestimonialCard from "../components/TestimonialCard";

const HomePage = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Detection",
      description:
        "Advanced machine learning algorithms analyze blood samples with 98% accuracy, providing rapid and reliable malaria diagnosis.",
    },
    {
      icon: Zap,
      title: "Instant Results",
      description:
        "Get diagnostic results in seconds, not hours. Our AI processes images instantly for immediate clinical decisions.",
    },
    {
      icon: Shield,
      title: "HIPAA Compliant",
      description:
        "Enterprise-grade security and full HIPAA compliance ensure patient data is protected at every step.",
    },
    {
      icon: LineChart,
      title: "Analytics Dashboard",
      description:
        "Comprehensive analytics and reporting tools help track trends, monitor outcomes, and improve patient care.",
    },
    {
      icon: Users,
      title: "Multi-User Support",
      description:
        "Role-based access for doctors, patients, and administrators with customized dashboards for each user type.",
    },
    {
      icon: Globe,
      title: "Cloud-Based Platform",
      description:
        "Access from anywhere with our secure cloud infrastructure. No installation required, always up-to-date.",
    },
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Upload Sample",
      description:
        "Upload microscopic blood sample images through our secure platform",
      icon: Upload,
    },
    {
      step: "02",
      title: "AI Analysis",
      description:
        "Our AI model analyzes the sample for malaria parasites in real-time",
      icon: FileSearch,
    },
    {
      step: "03",
      title: "Get Results",
      description:
        "Receive detailed diagnostic results with confidence scores instantly",
      icon: Award,
    },
  ];

  const benefits = [
    "Reduce diagnosis time from hours to seconds",
    "Improve accuracy with 98%+ detection rate",
    "Lower operational costs for hospitals",
    "Enable early intervention and treatment",
    "Support remote and rural healthcare facilities",
    "Integrate seamlessly with existing systems",
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Chief Pathologist",
      hospital: "City General Hospital",
      content:
        "This AI system has revolutionized our malaria diagnosis workflow. The accuracy and speed are remarkable, allowing us to treat patients much faster.",
    },
    {
      name: "Dr. Michael Chen",
      role: "Head of Infectious Diseases",
      hospital: "Regional Medical Center",
      content:
        "The platform is intuitive and the results are incredibly reliable. It has become an essential tool in our diagnostic arsenal.",
    },
    {
      name: "Dr. Priya Patel",
      role: "Medical Director",
      hospital: "Community Health Clinic",
      content:
        "Being able to provide instant malaria testing in our rural clinic has been a game-changer for patient outcomes and community health.",
    },
  ];

  const stats = [
    { value: "500K+", label: "Tests Analyzed" },
    { value: "98.5%", label: "Accuracy Rate" },
    { value: "200+", label: "Hospitals" },
    { value: "< 30s", label: "Average Time" },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
        {/* Animated Background */}
        <div className="absolute inset-0 gradient-bg opacity-10 dark:opacity-20" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" />
          <div
            className="absolute top-40 right-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute bottom-20 left-1/2 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"
            style={{ animationDelay: "4s" }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block mb-6"
            >
              <span className="px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-semibold">
                ✨ AI-Powered Healthcare Innovation
              </span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Revolutionize
              <br />
              <span className="gradient-text">Malaria Detection</span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              Empower your hospital with AI-driven diagnostics for faster, more
              accurate malaria detection and improved patient outcomes
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link to="/register">
                <Button size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                  Get Started Free
                </Button>
              </Link>
              <Link to="/detection">
                <Button variant="outline" size="lg">
                  Try Detection Now
                </Button>
              </Link>
            </motion.div>

            {/* Patient Reports Access */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8"
            >
              <Link to="/public-reports">
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  icon={<FileSearch className="w-5 h-5" />}
                >
                  View My Test Reports
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl font-bold gradient-text mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need for efficient malaria diagnosis in one
              platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} delay={index * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Simple, fast, and accurate malaria detection in three easy steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-primary-500 to-teal-500 -translate-x-4" />
                )}
                <div className="glass-panel rounded-xl p-8 text-center hover:shadow-xl transition-shadow">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 text-white text-2xl font-bold mb-6">
                    {step.step}
                  </div>
                  <step.icon className="w-12 h-12 mx-auto mb-4 text-primary-600 dark:text-primary-400" />
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl font-display font-bold text-gray-900 dark:text-white mb-6">
                Benefits for Your Hospital
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Transform your diagnostic capabilities and improve patient
                outcomes with our AI-powered platform
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300 text-lg">
                      {benefit}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="glass-panel rounded-2xl p-8 space-y-6">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Time Saved
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    95%
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Accuracy
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    98.5%
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center space-x-3">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Patients Served
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    500K+
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Healthcare Professionals
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Hear what doctors and medical professionals say about our platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                {...testimonial}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center gradient-bg rounded-3xl p-12 shadow-2xl"
        >
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-6">
            Ready to Transform Your Diagnostics?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join hundreds of hospitals already using our AI-powered malaria
            detection system
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-primary-600 hover:bg-gray-100"
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Start Free Trial
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                size="lg"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10"
              >
                Contact Sales
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;
