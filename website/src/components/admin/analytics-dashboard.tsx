"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  UsersIcon, 
  EyeIcon, 
  DownloadIcon, 
  ClockIcon,
  TrendingUpIcon,
  ActivityIcon,
  FileTextIcon,
  ShieldIcon
} from "lucide-react"
import { UserRole, getRoleDisplayName } from "@/lib/roles"

// Mock analytics data - replace with actual API calls
const mockAnalytics = {
  totalUsers: 24,
  activeUsers: 18,
  totalDocuments: 156,
  documentsDownloaded: 89,
  averageSessionTime: "12m 34s",
  topDocuments: [
    { name: "Financial Statements 2023-2024", downloads: 23, views: 45 },
    { name: "Equipment Inventory", downloads: 18, views: 32 },
    { name: "Balance Sheets 2022-2024", downloads: 15, views: 28 },
    { name: "Lease Agreements", downloads: 12, views: 25 },
    { name: "Tax Returns 2021-2023", downloads: 10, views: 22 }
  ],
  recentActivity: [
    {
      id: "1",
      user: { name: "Sarah Buyer", email: "sarah@investor.com", role: UserRole.BUYER },
      action: "Downloaded document",
      resource: "Financial Statements 2023-2024",
      timestamp: new Date("2024-01-27T14:30:00Z")
    },
    {
      id: "2", 
      user: { name: "Mike Viewer", email: "mike@consultant.com", role: UserRole.VIEWER },
      action: "Viewed document",
      resource: "Equipment Inventory",
      timestamp: new Date("2024-01-27T13:45:00Z")
    },
    {
      id: "3",
      user: { name: "John Admin", email: "admin@cranberryhearing.com", role: UserRole.ADMIN },
      action: "Updated user role",
      resource: "Jane Buyer → Qualified Buyer",
      timestamp: new Date("2024-01-27T12:20:00Z")
    },
    {
      id: "4",
      user: { name: "Jane Buyer", email: "jane@acquisition.com", role: UserRole.BUYER },
      action: "Logged in",
      resource: "System access",
      timestamp: new Date("2024-01-27T11:15:00Z")
    },
    {
      id: "5",
      user: { name: "Sarah Buyer", email: "sarah@investor.com", role: UserRole.BUYER },
      action: "Downloaded document",
      resource: "Balance Sheets 2022-2024",
      timestamp: new Date("2024-01-27T10:30:00Z")
    }
  ],
  userStats: {
    [UserRole.ADMIN]: 2,
    [UserRole.BUYER]: 8,
    [UserRole.VIEWER]: 6,
    [UserRole.GUEST]: 8
  },
  documentStats: {
    total: 156,
    byType: {
      financial: 45,
      equipment: 32,
      legal: 28,
      corporate: 25,
      other: 26
    },
    byAccess: {
      public: 12,
      authenticated: 89,
      buyer_only: 42,
      admin_only: 13
    }
  }
}

export function AnalyticsDashboard() {
  const { totalUsers, activeUsers, totalDocuments, documentsDownloaded, averageSessionTime, topDocuments, recentActivity, userStats, documentStats } = mockAnalytics

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "destructive"
      case UserRole.BUYER:
        return "default"
      case UserRole.VIEWER:
        return "secondary"
      case UserRole.GUEST:
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          Monitor user activity, document access, and system performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              {documentsDownloaded} downloads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Time</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageSessionTime}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUpIcon className="inline h-3 w-3 mr-1" />
              +5% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Document Downloads</CardTitle>
            <DownloadIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentsDownloaded}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUpIcon className="inline h-3 w-3 mr-1" />
              +12% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>User Statistics</CardTitle>
            <CardDescription>Breakdown of users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(userStats).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(role as UserRole)}>
                      {getRoleDisplayName(role as UserRole)}
                    </Badge>
                  </div>
                  <div className="text-sm font-medium">{count} users</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Document Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Document Statistics</CardTitle>
            <CardDescription>Documents by type and access level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">By Type</h4>
                <div className="space-y-2">
                  {Object.entries(documentStats.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{type}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">By Access Level</h4>
                <div className="space-y-2">
                  {Object.entries(documentStats.byAccess).map(([access, count]) => (
                    <div key={access} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{access.replace('_', ' ')}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Most Accessed Documents</CardTitle>
            <CardDescription>Documents with highest download and view counts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDocuments.map((doc, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DownloadIcon className="h-3 w-3" />
                        {doc.downloads}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <EyeIcon className="h-3 w-3" />
                        {doc.views}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest user actions and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`/avatars/${activity.user.email}.jpg`} />
                    <AvatarFallback>
                      {activity.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{activity.user.name}</span>
                      <Badge variant={getRoleBadgeVariant(activity.user.role)} className="text-xs">
                        {getRoleDisplayName(activity.user.role)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.action} <span className="font-medium">{activity.resource}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


