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
import { formatEventDateTime } from "@/lib/dateTime"

const sortSeats = (seats) => {
    return [...seats].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

function AdminBookings() {
    const [bookings, setBookings] = useState([])
    const [error, setError] = useState("")
    const [dateFilter, setDateFilter] = useState("all")

    const fetchBookings = useCallback(async () => {
        try {
            setError("")
            const res = await API.get("/bookings")
            setBookings(res.data.bookings)
        } catch (fetchError) {
            setError(fetchError.response?.data?.message || "Could not load bookings")
        }
    }, [])

    const groupedBookings = useMemo(() => {
        const groups = new Map()

        bookings.forEach((booking) => {
            const eventId = booking.event?._id || booking.event || "deleted-event"
            const userId = booking.user?._id || booking.user || "deleted-user"
            const key = `${eventId}:${userId}`

            if (!groups.has(key)) {
                groups.set(key, {
                    key,
                    event: booking.event,
                    user: booking.user,
                    bookingIds: [],
                    seats: [],
                    price: Number(booking.event?.price || 0),
                })
            }

            const group = groups.get(key)
            group.bookingIds.push(booking._id)
            group.seats.push(booking.seatNumber)
        })

        return Array.from(groups.values()).map((group) => ({
            ...group,
            seats: sortSeats(group.seats),
            total: group.price * group.bookingIds.length,
        }))
    }, [bookings])

    const filteredGroupedBookings = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        return groupedBookings.filter((bookingGroup) => {
            const eventDate = bookingGroup.event?.date ? new Date(bookingGroup.event.date) : null
            const matchesDate =
                dateFilter === "all" ||
                (dateFilter === "upcoming" && eventDate && eventDate >= today)

            return matchesDate
        })
    }, [dateFilter, groupedBookings])

    useEffect(() => {
        let isMounted = true

        API.get("/bookings")
            .then(res => {
                if (isMounted) {
                    setBookings(res.data.bookings)
                }
            })
            .catch(fetchError => {
                if (isMounted) {
                    setError(fetchError.response?.data?.message || "Could not load bookings")
                }
            })

        return () => {
            isMounted = false
        }
    }, [])

    const deleteBookingGroup = async (bookingGroup) => {
        try {
            await Promise.all(
                bookingGroup.bookingIds.map((bookingId) => API.delete(`/bookings/${bookingId}`))
            )
            fetchBookings()
        } catch (deleteError) {
            setError(deleteError.response?.data?.message || "Could not delete booking")
        }
    }

    return (
        <section className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight">Bookings</h1>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <CardTitle>Current Bookings</CardTitle>
                            <CardDescription>Review and remove event reservations.</CardDescription>
                        </div>
                        <Badge className="border-blue-950/20 bg-blue-950 text-amber-100">
                            {filteredGroupedBookings.length} groups
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    <div className="mb-4 flex justify-end">
                        <Select
                            value={dateFilter}
                            onValueChange={setDateFilter}
                        >
                            <SelectTrigger className="sm:w-44" aria-label="Filter bookings by date">
                                <SelectValue placeholder="All dates" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All dates</SelectItem>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {groupedBookings.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No bookings found.</p>
                    ) : filteredGroupedBookings.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No bookings match this filter.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Event</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Seats</TableHead>
                                    <TableHead>Count</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredGroupedBookings.map((bookingGroup) => (
                                    <TableRow key={bookingGroup.key}>
                                        <TableCell className="font-medium">
                                            {bookingGroup.event?.title || "Event deleted"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-0.5">
                                                <p>{bookingGroup.user?.name || "User deleted"}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {bookingGroup.user?.email || "-"}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1.5">
                                                {bookingGroup.seats.map((seatNumber) => (
                                                    <Badge key={seatNumber} variant="secondary">
                                                        {seatNumber}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="border-green-200 bg-green-100 text-green-700">
                                                {bookingGroup.bookingIds.length}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatEventDateTime(bookingGroup.event?.date, bookingGroup.event?.time)}
                                        </TableCell>
                                        <TableCell>
                                            Rs. {bookingGroup.total.toLocaleString("en-IN")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon-sm"
                                                        aria-label={`Delete bookings for ${bookingGroup.event?.title || "event"}`}
                                                        title="Delete bookings"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete these bookings?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will delete {bookingGroup.bookingIds.length} booking{bookingGroup.bookingIds.length === 1 ? "" : "s"} for {bookingGroup.event?.title || "this event"}. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            variant="destructive"
                                                            onClick={() => deleteBookingGroup(bookingGroup)}
                                                        >
                                                            Delete bookings
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </section>
    )
}

export default AdminBookings
