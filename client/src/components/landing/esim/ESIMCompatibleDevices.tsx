import { motion } from "framer-motion";

export const ESIMCompatibleDevices = () => {
  const devices = [
    {
      brand: "Apple",
      models: [
        "iPhone 15/14/13/12",
        "iPhone 11/XS/XR",
        "iPad Pro/Air",
        "Apple Watch",
      ],
    },
    {
      brand: "Samsung",
      models: [
        "Galaxy S24/S23/S22",
        "Galaxy Z Fold/Flip",
        "Galaxy Note 20",
        "Galaxy Watch",
      ],
    },
    {
      brand: "Google",
      models: [
        "Pixel 8/7/6",
        "Pixel 5/4/3",
        "Pixel Fold",
        "Pixel Watch",
      ],
    },
    {
      brand: "Others",
      models: [
        "Huawei P40/P50",
        "Oppo Find X3/X5",
        "Motorola Razr",
        "Surface Duo",
      ],
    },
  ];

  return (
    <div className="bg-background py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-manrope-bold font-bold text-foreground mb-3">
            Compatible Devices
          </h2>
          <p className="text-base font-inter-regular text-muted-foreground max-w-2xl mx-auto">
            Check if your device supports eSIM technology
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {devices.map((device, index) => (
            <motion.div
              key={device.brand}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card/80 backdrop-blur-xl rounded-lg p-4 border border-border"
            >
              <h3 className="text-lg font-manrope-bold font-bold text-foreground mb-3">
                {device.brand}
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                {device.models.map((model, i) => (
                  <li key={i}>✓ {model}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
