import React, { useEffect, useState } from 'react';
import { reportService } from '../../../services/report.service';
import ReportChart from '../components/ReportChart';
import { Loader } from '../../../common/components';

const DashboardReport = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await reportService.getDashboardStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch reports stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports Dashboard</h1>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-lg mb-4">Project Status Overview</h3>
                <ReportChart type="pie" data={stats?.projectStatus} />
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-lg mb-4">Tasks Completion Status</h3>
                <ReportChart type="bar" data={stats?.taskStatus} />
            </div>
        </div>
      )}
    </div>
  );
};

export default DashboardReport;
