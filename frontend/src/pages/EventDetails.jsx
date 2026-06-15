import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatEventDateTime } from "@/lib/dateTime";
import { useAuth } from "@/context/useAuth";
import API from "../api/axios";

const EventDetails = () => {
    const { id } = useParams();
    const { user, isAdmin, openLogin } = useAuth();
    const [event, setEvent] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [isBooking, setIsBooking] = useState(false);
    const [adminBookings, setAdminBookings] = useState([]);

    const fetchEvent = useCallback(async () => {
        try {
            const res = await API.get(`/events/${id}`);
            setEvent(res.data);
        } catch (error) {
            console.log(error);
        }
    }, [id]);

    useEffect(() => {
        let isMounted = true;

        API.get(`/events/${id}`)
            .then(res => {
                if (isMounted) {
                    setEvent(res.data);
                }
            })
            .catch(error => {
                console.log(error);
            });

        return () => {
            isMounted = false;
        };
    }, [id]);

    useEffect(() => {
        if (!isAdmin) {
            return;
        }

        let isMounted = true;

        API.get("/bookings")
            .then(res => {
                if (isMounted) {
                    setAdminBookings(res.data.bookings);
                }
            })
            .catch(error => {
                console.log(error);
            });

        return () => {
            isMounted = false;
        };
    }, [isAdmin]);

    const handleSeatSelect = (seatNumber) => {
        setError("");
        setNotice("");

        if (selectedSeats.includes(seatNumber)) {
            setSelectedSeats(
                selectedSeats.filter(
                    seat => seat !== seatNumber
                )
            );
        } else {
            setSelectedSeats([
                ...selectedSeats,
                seatNumber
            ]);
        }
    };

    const bookSelectedSeats = useCallback(async () => {
        try {
            setIsBooking(true);
            setError("");
            setNotice("");

            await Promise.all(
                selectedSeats.map(seatNumber =>
                    API.post(
                        "/bookings",
                        {
                            eventId: event._id,
                            seatNumber
                        }
                    )
                )
            );

            fetchEvent();
            setSelectedSeats([]);
            setNotice("Booking successful.");
        } catch (error) {
            setError(error.response?.data?.message || "Booking failed");
        } finally {
            setIsBooking(false);
        }
    }, [event, fetchEvent, selectedSeats]);

    const handleBooking = async () => {
        if (event?.seats?.every(seat => seat.isBooked)) {
            setError("This event is sold out.");
            return;
        }

        if (selectedSeats.length === 0) {
            setError("Please select at least one seat.");
            return;
        }

        if (!user) {
            openLogin({
                message: "Sign in to book your selected seats.",
                onSuccess: bookSelectedSeats,
            });
            return;
        }

        await bookSelectedSeats();
    };

    const bookingBySeat = useMemo(() => {
        return adminBookings.reduce((bookings, booking) => {
            const bookingEventId = booking.event?._id || booking.event;

            if (bookingEventId === id) {
                bookings[booking.seatNumber] = booking;
            }

            return bookings;
        }, {});
    }, [adminBookings, id]);

    const eventBookings = useMemo(() => {
        return adminBookings.filter((booking) => {
            const bookingEventId = booking.event?._id || booking.event;

            return bookingEventId === id;
        });
    }, [adminBookings, id]);

    if (!event) {
        return (
            <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                    Loading...
                </CardContent>
            </Card>
        );
    }

    const availableSeats = event.seats.filter(seat => !seat.isBooked).length;
    const bookedSeats = event.seats.length - availableSeats;
    const isSoldOut = availableSeats === 0;
    const totalPrice = selectedSeats.length * Number(event.price);
    const totalRevenue = eventBookings.length * Number(event.price);

    const renderAdminSeatTooltip = (seat) => {
        if (!seat.isBooked) {
            return <p className="font-medium">Available</p>;
        }

        const booking = bookingBySeat[seat.seatNumber];

        if (!booking) {
            return <p className="font-medium">Booked</p>;
        }

        return (
            <div className="space-y-1">
                <p className="font-semibold">Booked seat {seat.seatNumber}</p>
                <p>{booking.user?.name || "Unknown user"}</p>
                <p className="text-amber-100/80">{booking.user?.email || "No email available"}</p>
                <p className="text-amber-100/80">
                    Booked on {new Date(booking.createdAt).toLocaleDateString()}
                </p>
            </div>
        );
    };

    return (
        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
                <Button asChild variant="ghost" className="w-fit pl-2 text-blue-950">
                    <Link to="/events">
                        <ArrowLeft className="size-4" />
                        Events
                    </Link>
                </Button>

                <Card>
                    <CardHeader className="space-y-3">
                        <Badge className="w-fit border-blue-950/20 bg-blue-950 text-amber-100">
                            {formatEventDateTime(event.date, event.time)}
                        </Badge>
                        <CardTitle className="text-3xl">
                            {event.title}
                        </CardTitle>
                        <CardDescription className="max-w-3xl text-base leading-7">
                            {event.description}
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                                <CardTitle>
                                Select Seats
                                </CardTitle>
                                <CardDescription>
                                {isSoldOut ? "This event is sold out" : `${availableSeats} of ${event.seats.length} available`}
                                </CardDescription>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {selectedSeats.length} selected
                        </p>
                    </div>
                    </CardHeader>

                    <CardContent>
                    <TooltipProvider>
                    <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-10">
                        {event.seats.map((seat) => {
                            const isSelected = selectedSeats.includes(seat.seatNumber);
                            const seatButton = (
                                <button
                                    key={seat.seatNumber}
                                    disabled={seat.isBooked || isAdmin}
                                    onClick={() => handleSeatSelect(seat.seatNumber)}
                                    className={cn(
                                        "h-10 w-full rounded-md border text-sm font-medium transition focus:outline-none focus:ring-3 focus:ring-primary/15",
                                        "disabled:border-muted disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60",
                                        isAdmin && "cursor-default disabled:opacity-100",
                                        seat.isBooked && !isAdmin && "cursor-not-allowed",
                                        isSelected
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "bg-background hover:border-primary/50 hover:bg-primary/5"
                                    )}
                                >
                                    {seat.seatNumber}
                                </button>
                            );

                            if (!isAdmin) {
                                return seatButton;
                            }

                            return (
                                <Tooltip key={seat.seatNumber}>
                                    <TooltipTrigger asChild>
                                        <span className="block">{seatButton}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {renderAdminSeatTooltip(seat)}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>
                    </TooltipProvider>

                    <div className="mt-5 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <span className="size-2 rounded-full border bg-background" />
                            Available
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-primary" />
                            Selected
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-muted" />
                            Booked
                        </span>
                    </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="h-fit lg:sticky lg:top-24">
                <CardHeader>
                    <CardTitle>{isAdmin ? "Event Stats" : "Summary"}</CardTitle>
                </CardHeader>
                <CardContent>
                    {isAdmin ? (
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Booked seats</span>
                                <span className="font-medium">{bookedSeats}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Available seats</span>
                                <span className="font-medium">{availableSeats}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Total seats</span>
                                <span className="font-medium">{event.seats.length}</span>
                            </div>
                            <div className="border-t pt-3">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-muted-foreground">Revenue</span>
                                    <span className="text-lg font-semibold">
                                        Rs. {totalRevenue.toLocaleString("en-IN")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Price</span>
                                <span className="font-medium">
                                    Rs. {Number(event.price).toLocaleString("en-IN")}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Seats</span>
                                <span className="font-medium">
                                    {selectedSeats.length ? selectedSeats.join(", ") : "-"}
                                </span>
                            </div>
                            <div className="border-t pt-3">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-muted-foreground">Total</span>
                                    <span className="text-lg font-semibold">
                                        Rs. {totalPrice.toLocaleString("en-IN")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    {notice && (
                        <p className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-blue-950">
                            {notice}
                        </p>
                    )}

                    {!isAdmin && (
                        <Button
                            onClick={handleBooking}
                            disabled={isSoldOut || selectedSeats.length === 0 || isBooking}
                            className="mt-6 w-full"
                        >
                            {isSoldOut ? "Sold Out" : isBooking ? "Booking..." : "Book Seats"}
                        </Button>
                    )}
                </CardContent>
            </Card>
        </section>
    );
};

export default EventDetails;
