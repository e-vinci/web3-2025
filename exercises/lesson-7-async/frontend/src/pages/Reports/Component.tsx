import { useState, useEffect } from 'react';
import { useLoaderData } from 'react-router';
import { gql } from '@apollo/client';
import { toast } from 'sonner';
import { Download, FileText, Loader2 } from 'lucide-react';
import graphqlClient from '@/lib/graphql-client';

// GraphQL operations
const REQUEST_EXPENSE_REPORT_GQL = gql`
     mutation RequestExpenseReport($startDate: String, $endDate: String) {
       requestExpenseReport(startDate: $startDate, endDate: $endDate) {
         reportId
         status
         progress
         createdAt
       }
     }
   `;

const GET_REPORT_STATUS_GQL = gql`
     query GetReportStatus($reportId: String!) {
       reportJobStatus(reportId: $reportId) {
         reportId
         status
         progress
         downloadUrl
         createdAt
         failedReason
       }
     }
   `;

interface ReportJob {
    reportId: string;
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
    progress: number | null;
    downloadUrl?: string;
    createdAt: string;
    failedReason?: string;
}

export default function Reports() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentReportId, setCurrentReportId] = useState<string | null>(null);
    const [reportStatus, setReportStatus] = useState<ReportJob | null>(null);
    const [isRequesting, setIsRequesting] = useState(false);
    const [isPolling, setIsPolling] = useState(false);

    // Function to request a new PDF report
    const requestReport = async () => {
        setIsRequesting(true);
        try {
            const response = await graphqlClient.mutate({
                mutation: REQUEST_EXPENSE_REPORT_GQL,
                variables: {
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                },
            });

            const reportData = response.data.requestExpenseReport;
            setCurrentReportId(reportData.reportId);
            setReportStatus(reportData);
            toast.success('PDF generation started!');
        } catch (error) {
            console.error('Failed to request report:', error);
            toast.error(`Failed to start PDF generation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsRequesting(false);
        }
    };

    // Function to check report status
    const checkReportStatus = async (reportId: string) => {
        try {
            const response = await graphqlClient.query({
                query: GET_REPORT_STATUS_GQL,
                variables: { reportId },
                fetchPolicy: 'network-only', // Always fetch fresh data
            });

            const status = response.data.reportJobStatus;
            if (status) {
                setReportStatus(status);

                if (status.status === 'completed') {
                    toast.success('PDF report ready for download!');
                    setIsPolling(false);
                } else if (status.status === 'failed') {
                    toast.error('PDF generation failed');
                    setIsPolling(false);
                }
            }
        } catch (error) {
            console.error('Failed to check report status:', error);
            setIsPolling(false);
        }
    };

    // Polling effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (currentReportId && isPolling) {
            interval = setInterval(() => {
                checkReportStatus(currentReportId);
            }, 1000); // Poll every second
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [currentReportId, isPolling]);

    // Start polling when we have a report ID and it's not completed/failed
    useEffect(() => {
        if (currentReportId && reportStatus &&
            reportStatus.status !== 'completed' &&
            reportStatus.status !== 'failed') {
            setIsPolling(true);
        }
    }, [currentReportId, reportStatus]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        requestReport();
    };

    const handleDownload = () => {
        if (reportStatus?.downloadUrl) {
            const link = document.createElement('a');
            link.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${reportStatus.downloadUrl}`;
            link.download = `expense-report-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600';
            case 'failed': return 'text-red-600';
            case 'active': return 'text-blue-600';
            default: return 'text-yellow-600';
        }
    };

    return (
        <section className="container mx-auto px-4 py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-6 w-6" />
                    PDF Reports
                </h1>
                <p className="text-muted-foreground">
                    Generate and download PDF expense reports
                </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Report Generation Form */}
                <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Generate New Report</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-2">
                                    Start Date (optional)
                                </label>
                                <input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-foreground mb-2">
                                    End Date (optional)
                                </label>
                                <input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isRequesting}
                            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isRequesting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Requesting Report...
                                </>
                            ) : (
                                'Generate PDF Report'
                            )}
                        </button>
                    </form>
                </div>

                {/* Report Status */}
                {reportStatus && (
                    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Report Status</h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-foreground">Report ID:</span>
                                <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                                    {reportStatus.reportId}
                                </code>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-foreground">Status:</span>
                                <span className={`capitalize font-medium ${getStatusColor(reportStatus.status)}`}>
                                    {reportStatus.status}
                                </span>
                            </div>

                            {reportStatus.progress !== null && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-foreground">Progress:</span>
                                        <span className="text-foreground">{reportStatus.progress}%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${reportStatus.progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {reportStatus.status === 'completed' && reportStatus.downloadUrl && (
                                <button
                                    onClick={handleDownload}
                                    className="w-full bg-secondary text-secondary-foreground py-2 px-4 rounded-md hover:bg-secondary/90 flex items-center justify-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Download PDF Report
                                </button>
                            )}

                            {reportStatus.status === 'failed' && reportStatus.failedReason && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                                    <p className="text-destructive text-sm">
                                        Report generation failed: {reportStatus.failedReason}
                                    </p>
                                </div>
                            )}

                            <p className="text-sm text-muted-foreground">
                                Requested: {new Date(reportStatus.createdAt).toLocaleString()}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}