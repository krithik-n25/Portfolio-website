export interface Research {
  period: string;
  title: string;
  org: string;
  status: string;
  points: string[];
  tags: string[];
}

export const research: Research[] = [
  {
    period: "Mar 2025 – Jun 2026",
    title: "Edge AI for Resource-Constrained Devices",
    org: "Independent research · review article",
    status: "Submitted · under peer review",
    points: [
      "Co-authored a comprehensive 9-section survey on efficient deep learning deployment across microcontrollers, embedded systems and Internet of Things devices.",
      "Covered model compression (pruning, quantisation, knowledge distillation), efficient architectures (MobileNet, EfficientNet), TinyML frameworks and federated learning at the edge.",
      "Surveyed TensorFlow Lite for Microcontrollers, Edge Impulse, ARM CMSIS-NN and Apache TVM, with benchmarking using MLPerf Tiny standards.",
      "Explored applications in computer vision, healthcare wearables, smart IoT and industrial predictive maintenance, including YOLO-based object detection and LSTM-based chronic disease prediction.",
    ],
    tags: ["TinyML", "Model compression", "Federated learning", "MLPerf Tiny"],
  },
  {
    period: "Jul 2026",
    title: "Quantitative Research Job Simulation",
    org: "JPMorgan Chase & Co. · Forage",
    status: "Research experience",
    points: [
      "Analyzed financial price data to identify trends, patterns and relevant market insights.",
      "Learned to price commodity storage contracts using quantitative and financial modelling concepts.",
      "Performed credit risk analysis to evaluate borrower risk and understand key financial indicators.",
      "Worked with FICO scores, including data analysis and risk-based score bucketing.",
      "Gained practical exposure to Python-based data analysis, quantitative modelling, financial risk assessment and interpreting financial datasets.",
    ],
    tags: [
      "Python",
      "Data Analysis",
      "Quantitative Research",
      "Financial Modelling",
      "Credit Risk Analysis",
      "Statistical Analysis",
      "Data Interpretation",
      "Risk Assessment",
    ],
  },
];
