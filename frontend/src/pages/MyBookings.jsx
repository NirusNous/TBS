import { useCallback, useEffect, useMemo, useState } from "react"
import { Trash2 } from "lucide-react"
import { Navigate, Link } from "react-router-dom"

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
import { useAuth } from "@/context/useAuth"
import { formatEventDateTime } from "@/lib/dateTime"

const sortSeats = (seats) => {
    return [...seats].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

function MyBookings() {
    const { isAdmin } = useAuth()
    const [bookings, setBookings] = useState([])
    const [error, setError] = useState("")
    const [dateFilter, setDateFilter] = useState("all")

    const fetchBookings = useCallback(async () => {
        try {
            setError("")
            const res = await API.get("/bookings/my-bookings")
            setBookings(res.data.bookings)
        } catch (fetchError) {
            setError(fetchError.response?.data?.message || "Could not load bookings")
        }
    }, [])

    const groupedBookings = useMemo(() => {
        const groups = new Map()

        bookings.forEach((booking) => {
            const eventId = booking.event?._id || booking.event || "deleted-event"

            if (!groups.has(eventId)) {
                groups.set(eventId, {
                    key: eventId,
                    event: booking.event,
                    bookingIds: [],
                    seats: [],
                    price: Number(booking.event?.price || 0),
                })
            }

            const group = groups.get(eventId)
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

        API.get("/bookings/my-bookings")
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

    const cancelBookingGroup = async (bookingGroup) => {
        try {
            await Promise.all(
                bookingGroup.bookingIds.map((bookingId) => API.delete(`/bookings/${bookingId}`))
            )
            fetchBookings()
        } catch (cancelError) {
            setError(cancelError.response?.data?.message || "Could not cancel booking")
        }
    }

    if (isAdmin) {
        return <Navigate to="/admin/bookings" replace />
    }

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <h1 className="text-3xl font-semibold tracking-tight">My Bookings</h1>
                <p className="text-sm text-muted-foreground">
                    {filteredGroupedBookings.length} {filteredGroupedBookings.length === 1 ? "event" : "events"}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Tickets</CardTitle>
                    <CardDescription>Seats you have reserved for upcoming events.</CardDescription>
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
                        <div className="space-y-4 text-sm text-muted-foreground">
                            <p>No bookings yet.</p>
                            <Button asChild variant="outline">
                                <Link to="/events">Browse Events</Link>
                            </Button>
                        </div>
                    ) : filteredGroupedBookings.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No bookings match this filter.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Event</TableHead>
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
                                                        aria-label={`Cancel bookings for ${bookingGroup.event?.title || "event"}`}
                                                        title="Cancel bookings"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Cancel these bookings?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will cancel {bookingGroup.bookingIds.length} booking{bookingGroup.bookingIds.length === 1 ? "" : "s"} for {bookingGroup.event?.title || "this event"}. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Keep bookings</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            variant="destructive"
                                                            onClick={() => cancelBookingGroup(bookingGroup)}
                                                        >
                                                            Cancel bookings
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

export default MyBookings
