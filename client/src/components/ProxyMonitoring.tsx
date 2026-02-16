export default function ProxyMonitoring() {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">Proxy Status</h2>
      <div className="space-y-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white">192.168.1.1:8080</p>
              <p className="text-sm text-gray-400">HTTP - United States</p>
            </div>
            <span className="px-2 py-1 text-sm rounded-full bg-green-100 text-green-800">
              Active
            </span>
          </div>
          <div className="mt-2">
            <div className="bg-gray-600 rounded-full h-2">
              <div className="bg-blue-500 rounded-full h-2" style={{ width: "45%" }}></div>
            </div>
            <p className="mt-1 text-sm text-gray-400">Bandwidth: 45 GB / 100 GB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
