export const chart_bar = {
  type: "bar",
  data: {
    labels: ["Q1", "Q2", "Q3", "Q4"],
    datasets: [
      {
        label: "Sales ($k)",
        data: [120, 190, 300, 500],
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 205, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 205, 86, 1)",
          "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 1,
      },
    ],
  },
};

export const chart_line = {
  type: "line",
  data: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Website Visitors",
        data: [1500, 2000, 1800, 2200, 2600, 3000],
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  },
  options: {
    responsive: true,
    plugins: { legend: { position: "top" } },
  },
};

export const chart_pie = {
  type: "pie",
  data: {
    labels: ["Chrome", "Safari", "Firefox", "Edge"],
    datasets: [
      {
        label: "Browser Market Share",
        data: [63, 19, 10, 8],
        backgroundColor: [
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 205, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
        ],
        borderWidth: 1,
      },
    ],
  },
};

export const chart_radar = {
  type: "radar",
  data: {
    labels: ["Speed", "Reliability", "Comfort", "Safety", "Efficiency"],
    datasets: [
      {
        label: "Car A",
        data: [65, 59, 90, 81, 56],
        fill: true,
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgb(255, 99, 132)",
        pointBackgroundColor: "rgb(255, 99, 132)",
      },
      {
        label: "Car B",
        data: [28, 48, 40, 19, 96],
        fill: true,
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgb(54, 162, 235)",
        pointBackgroundColor: "rgb(54, 162, 235)",
      },
    ],
  },
};

export const chart_scatter = {
  type: "scatter",
  data: {
    datasets: [
      {
        label: "Experiment A",
        data: [
          { x: -10, y: 0 },
          { x: 0, y: 10 },
          { x: 10, y: 5 },
          { x: 5, y: 15 },
          { x: -5, y: 5 },
        ],
        backgroundColor: "rgba(75, 192, 192, 1)",
      },
    ],
  },
  options: {
    scales: {
      x: { type: "linear", position: "bottom" },
    },
  },
};

export const chart_stacked_bar = {
  type: "bar",
  data: {
    labels: ["Product A", "Product B", "Product C"],
    datasets: [
      {
        label: "2024",
        data: [300, 200, 400],
        backgroundColor: "rgba(255, 99, 132, 0.7)",
      },
      {
        label: "2025",
        data: [400, 250, 500],
        backgroundColor: "rgba(54, 162, 235, 0.7)",
      },
    ],
  },
  options: {
    scales: {
      x: { stacked: true },
      y: { stacked: true },
    },
  },
};

export const chart_doughnut = {
  type: "doughnut",
  data: {
    labels: ["Japan", "USA", "Germany", "UK"],
    datasets: [
      {
        label: "Market Share (%)",
        data: [25, 40, 20, 15],
        backgroundColor: [
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 205, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
        ],
        borderColor: "white",
        borderWidth: 2,
      },
    ],
  },
  options: {
    cutout: "60%",
    plugins: {
      legend: { position: "right" },
      title: { display: true, text: "Regional Market Share" },
    },
  },
};

export const chart_mixed = {
  data: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May"],
    datasets: [
      {
        type: "bar",
        label: "Revenue ($k)",
        data: [50, 60, 70, 80, 90],
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
      {
        type: "line",
        label: "Growth (%)",
        data: [10, 15, 13, 20, 18],
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        yAxisID: "y1",
      },
    ],
  },
  options: {
    responsive: true,
    interaction: { mode: "index", intersect: false },
    stacked: false,
    scales: {
      y: { type: "linear", display: true, position: "left", title: { display: true, text: "Revenue ($k)" } },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        grid: { drawOnChartArea: false },
        title: { display: true, text: "Growth (%)" },
      },
    },
  },
};

export const chart_time_series = {
  type: "line",
  data: {
    datasets: [
      {
        label: "Temperature (°C)",
        data: [
          { x: "2025-01-01", y: 5 },
          { x: "2025-02-01", y: 8 },
          { x: "2025-03-01", y: 12 },
          { x: "2025-04-01", y: 18 },
          { x: "2025-05-01", y: 22 },
        ],
        borderColor: "rgba(255, 159, 64, 1)",
        backgroundColor: "rgba(255, 159, 64, 0.2)",
        tension: 0.3,
      },
    ],
  },
  options: {
    scales: {
      x: {
        type: "time",
        time: {
          unit: "month",
          displayFormats: { month: "MMM" },
        },
        title: { display: true, text: "Month" },
      },
      y: {
        title: { display: true, text: "Temperature (°C)" },
        beginAtZero: false,
      },
    },
  },
};
