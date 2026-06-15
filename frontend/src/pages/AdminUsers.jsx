import { useCallback, useEffect, useMemo, useState } from "react"
import { Trash2 } from "lucide-react"

import API from "@/api/axios"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/context/useAuth"

const formatDate = (date) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString()
}

function AdminUsers() {
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState([])
    const [error, setError] = useState("")
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")

    const fetchUsers = useCallback(async () => {
        try {
            setError("")
            const res = await API.get("/auth/users")
            setUsers(res.data.users)
        } catch (fetchError) {
            setError(fetchError.response?.data?.message || "Could not load users")
        }
    }, [])

    useEffect(() => {
        let isMounted = true

        API.get("/auth/users")
            .then(res => {
                if (isMounted) {
                    setUsers(res.data.users)
                }
            })
            .catch(fetchError => {
                if (isMounted) {
                    setError(fetchError.response?.data?.message || "Could not load users")
                }
            })

        return () => {
            isMounted = false
        }
    }, [])

    const deleteUser = async (userId) => {
        try {
            await API.delete(`/auth/users/${userId}`)
            fetchUsers()
        } catch (deleteError) {
            setError(deleteError.response?.data?.message || "Could not delete user")
        }
    }

    const filteredUsers = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase()

        return users.filter((user) => {
            const matchesSearch = !normalizedSearch ||
                user.name.toLowerCase().includes(normalizedSearch) ||
                user.email.toLowerCase().includes(normalizedSearch)
            const matchesRole = roleFilter === "all" || user.role === roleFilter

            return matchesSearch && matchesRole
        })
    }, [roleFilter, search, users])

    return (
        <section className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <CardTitle>All Users</CardTitle>
                            <CardDescription>Manage registered customer accounts.</CardDescription>
                        </div>
                        <Badge className="border-blue-950/20 bg-blue-950 text-amber-100">
                            {filteredUsers.length} users
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_160px]">
                        <Input
                            type="search"
                            placeholder="Search users"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                        <Select
                            value={roleFilter}
                            onValueChange={setRoleFilter}
                        >
                            <SelectTrigger aria-label="Filter users by role">
                                <SelectValue placeholder="All roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All roles</SelectItem>
                                <SelectItem value="user">Users</SelectItem>
                                <SelectItem value="admin">Admins</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {users.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No users found.</p>
                    ) : filteredUsers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No users match your search.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => {
                                    const isCurrentUser = currentUser?._id === user._id
                                    const canDelete = user.role !== "admin" && !isCurrentUser

                                    return (
                                        <TableRow key={user._id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(user.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon-sm"
                                                            disabled={!canDelete}
                                                            aria-label={`Delete ${user.name}`}
                                                            title="Delete user"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will delete {user.name}'s account and their bookings. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                variant="destructive"
                                                                onClick={() => deleteUser(user._id)}
                                                            >
                                                                Delete user
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </section>
    )
}

export default AdminUsers
