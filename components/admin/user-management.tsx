"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, MoreHorizontal, Shield, UserX, UserCheck } from "lucide-react"
import { getUsers, disableUser, enableUser, type UserListItem } from "@/lib/services/user-management-service"
import { updateUserRole } from "@/lib/services/user-management-service"
import { useAdmin } from "./admin-provider"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export function UserManagement() {
  const { isSuperAdmin } = useAdmin()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<UserListItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState<string>("")
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setIsLoading(true)
    try {
      const { users: fetchedUsers } = await getUsers({ limit: 100 })
      setUsers(fetchedUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      if (!user.name.toLowerCase().includes(search) && !user.email.toLowerCase().includes(search)) {
        return false
      }
    }

    // Apply role filter
    if (selectedRole && user.role !== selectedRole) {
      return false
    }

    return true
  })

  const handleDisableUser = async (userId: string) => {
    try {
      await disableUser(userId)
      toast({
        title: "User disabled",
        description: "The user has been disabled successfully.",
      })
      fetchUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disable user. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEnableUser = async (userId: string) => {
    try {
      await enableUser(userId)
      toast({
        title: "User enabled",
        description: "The user has been enabled successfully.",
      })
      fetchUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enable user. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openRoleDialog = (user: UserListItem) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setIsRoleDialogOpen(true)
  }

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return

    setIsUpdatingRole(true)
    try {
      await updateUserRole(selectedUser.id, newRole as any)
      toast({
        title: "Role updated",
        description: `User role has been updated to ${newRole}.`,
      })
      setIsRoleDialogOpen(false)
      fetchUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingRole(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-slate-500">Manage users and their roles in the system.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={selectedRole || ""} onValueChange={(value) => setSelectedRole(value || null)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All roles</SelectItem>
              <SelectItem value="user">Regular users</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="super_admin">Super admins</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => fetchUsers()}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No users found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {user.photoURL ? (
                              <AvatarImage src={user.photoURL || "/placeholder.svg"} alt={user.name} />
                            ) : (
                              <AvatarFallback>
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .substring(0, 2)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={user.role} />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">{user.createdAt.toLocaleDateString()}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {user.lastLogin ? user.lastLogin.toLocaleDateString() : "Never"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isSuperAdmin && (
                              <DropdownMenuItem onClick={() => openRoleDialog(user)}>
                                <Shield className="mr-2 h-4 w-4" />
                                Change role
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDisableUser(user.id)}>
                              <UserX className="mr-2 h-4 w-4" />
                              Disable user
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEnableUser(user.id)}>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Enable user
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>Update the role for {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Select Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Regular User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={isUpdatingRole}>
              {isUpdatingRole ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case "super_admin":
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Super Admin</Badge>
    case "admin":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Admin</Badge>
    default:
      return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">User</Badge>
  }
}
