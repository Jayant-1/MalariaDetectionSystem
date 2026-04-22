import jsPDF from "jspdf";

/**
 * Generate PDF report for malaria test results
 */
export const generatePDFReport = ({
  patientName,
  patientId,
  testDate,
  testType,
  result,
  confidence,
  status,
  doctorName,
  hospital,
  parasitizedProb,
  uninfectedProb,
  predictedClass,
  imageQuality,
  additionalNotes = "",
}) => {
  const doc = new jsPDF();

  // Set up colors
  const primaryColor = [30, 144, 255]; // Blue
  const successColor = [34, 197, 94]; // Green
  const errorColor = [239, 68, 68]; // Red
  const textColor = [55, 65, 81]; // Gray-700

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, "bold");
  doc.text("MALARIA TEST REPORT", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text("AI-Powered Diagnostic System", 105, 30, { align: "center" });

  // Patient Information Section
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text("Patient Information", 20, 55);

  doc.setFontSize(11);
  doc.setFont(undefined, "normal");
  let yPos = 65;

  const patientInfo = [
    ["Patient Name:", patientName || "N/A"],
    ["Medical Record No:", patientId || "N/A"],
    ["Test Date:", testDate || new Date().toLocaleDateString()],
    ["Test Type:", testType || "Malaria Detection"],
  ];

  patientInfo.forEach(([label, value]) => {
    doc.setFont(undefined, "bold");
    doc.text(label, 20, yPos);
    doc.setFont(undefined, "normal");
    doc.text(value, 70, yPos);
    yPos += 8;
  });

  // Test Results Section
  yPos += 10;
  doc.setFillColor(240, 240, 240);
  doc.rect(15, yPos - 5, 180, 60, "F");

  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text("Test Results", 20, yPos + 5);

  yPos += 15;
  doc.setFontSize(12);

  // Result status with color
  const isInfected =
    result?.toLowerCase() === "positive" ||
    result?.toLowerCase() === "parasitized" ||
    predictedClass?.toLowerCase() === "parasitized";

  doc.setFont(undefined, "bold");
  doc.text("Status:", 20, yPos);

  if (isInfected) {
    doc.setTextColor(...errorColor);
  } else {
    doc.setTextColor(...successColor);
  }

  doc.setFontSize(14);
  doc.text(isInfected ? "POSITIVE" : "NEGATIVE", 70, yPos);

  yPos += 10;
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont(undefined, "normal");

  const resultDetails = [
    ["Predicted Class:", predictedClass || result || "N/A"],
    ["Confidence Level:", confidence ? `${confidence}%` : "N/A"],
    ["Test Status:", status || "Completed"],
  ];

  resultDetails.forEach(([label, value]) => {
    doc.setFont(undefined, "bold");
    doc.text(label, 20, yPos);
    doc.setFont(undefined, "normal");
    doc.text(String(value), 70, yPos);
    yPos += 8;
  });

  // AI Analysis Details
  if (parasitizedProb || uninfectedProb) {
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("AI Analysis Details", 20, yPos);

    yPos += 10;
    doc.setFontSize(11);
    doc.setFont(undefined, "normal");

    if (parasitizedProb) {
      doc.setFont(undefined, "bold");
      doc.text("Parasitized Probability:", 20, yPos);
      doc.setFont(undefined, "normal");
      doc.text(parasitizedProb, 80, yPos);
      yPos += 8;
    }

    if (uninfectedProb) {
      doc.setFont(undefined, "bold");
      doc.text("Uninfected Probability:", 20, yPos);
      doc.setFont(undefined, "normal");
      doc.text(uninfectedProb, 80, yPos);
      yPos += 8;
    }

    if (imageQuality) {
      doc.setFont(undefined, "bold");
      doc.text("Image Quality:", 20, yPos);
      doc.setFont(undefined, "normal");
      doc.text(imageQuality, 80, yPos);
      yPos += 8;
    }
  }

  // Medical Personnel Section
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text("Medical Personnel", 20, yPos);

  yPos += 10;
  doc.setFontSize(11);
  doc.setFont(undefined, "normal");

  const medicalInfo = [
    ["Doctor:", doctorName || "N/A"],
    ["Hospital/Clinic:", hospital || "N/A"],
  ];

  medicalInfo.forEach(([label, value]) => {
    doc.setFont(undefined, "bold");
    doc.text(label, 20, yPos);
    doc.setFont(undefined, "normal");
    doc.text(value, 70, yPos);
    yPos += 8;
  });

  // Additional Notes
  if (additionalNotes) {
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("Additional Notes", 20, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    const splitNotes = doc.splitTextToSize(additionalNotes, 170);
    doc.text(splitNotes, 20, yPos);
    yPos += splitNotes.length * 5;
  }

  // Disclaimer
  yPos = 260; // Fixed position near bottom
  doc.setFillColor(255, 243, 205);
  doc.rect(15, yPos, 180, 20, "F");

  doc.setFontSize(8);
  doc.setFont(undefined, "italic");
  doc.setTextColor(180, 83, 9);
  const disclaimer =
    "This report is generated by an AI-powered system and should be reviewed by a qualified healthcare professional. " +
    "This is not a substitute for professional medical advice, diagnosis, or treatment.";
  const splitDisclaimer = doc.splitTextToSize(disclaimer, 170);
  doc.text(splitDisclaimer, 20, yPos + 5);

  // Footer
  doc.setTextColor(...textColor);
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 290, {
    align: "center",
  });

  return doc;
};

/**
 * Generate and download PDF report for doctor
 */
export const generateDoctorReport = (testData) => {
  const doc = generatePDFReport({
    patientName: testData.patientName,
    patientId: testData.patientId || "N/A",
    testDate: testData.testDate,
    testType: testData.testType,
    result: testData.result,
    confidence: testData.confidence,
    status: testData.status,
    doctorName: testData.doctorName,
    hospital: testData.hospital,
    predictedClass: testData.predictedClass,
    parasitizedProb: testData.parasitizedProb,
    uninfectedProb: testData.uninfectedProb,
    imageQuality: testData.imageQuality,
    additionalNotes: testData.additionalNotes,
  });

  const fileName = `Malaria_Report_${testData.patientName?.replace(
    /\s+/g,
    "_"
  )}_${testData.testDate?.replace(/\//g, "-")}.pdf`;
  doc.save(fileName);
};

/**
 * Generate and download PDF report for patient
 */
export const generatePatientReport = (testData) => {
  const doc = generatePDFReport({
    patientName: "Patient",
    testDate: testData.date,
    testType: testData.testType,
    result: testData.result,
    confidence: testData.confidence,
    status: testData.status,
    doctorName: testData.doctor,
    hospital: testData.hospital,
    predictedClass: testData.predictedClass,
    parasitizedProb: testData.parasitizedProb,
    uninfectedProb: testData.uninfectedProb,
    imageQuality: testData.imageQuality,
  });

  const fileName = `Malaria_Test_Report_${testData.date?.replace(
    /\//g,
    "-"
  )}.pdf`;
  doc.save(fileName);
};
