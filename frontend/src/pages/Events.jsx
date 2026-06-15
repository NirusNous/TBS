import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatEventDateTime } from "@/lib/dateTime";
import { cn } from "@/lib/utils";
import API from "../api/axios";

const getAvailableSeats = (event) => {
    return event.seats?.filter(seat => !seat.isBooked).length || 0;
};

const Events = () => {
    const [events, setEvents] = useState([]);
    const [search, setSearch] = useState("");
    const [availabilityFilter, setAvailabilityFilter] = useState("all");

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await API.get("/events");
                setEvents(res.data.events);
            } catch (error) {
                console.log(error);
            }
        };

        fetchEvents();
    }, []);

    const filteredEvents = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return events.filter((event) => {
            const availableSeats = getAvailableSeats(event);
            const matchesSearch = !normalizedSearch ||
                event.title.toLowerCase().includes(normalizedSearch) ||
                event.description.toLowerCase().includes(normalizedSearch);
            const matchesAvailability =
                availabilityFilter === "all" ||
                (availabilityFilter === "available" && availableSeats > 0) ||
                (availabilityFilter === "sold-out" && availableSeats === 0);

            return matchesSearch && matchesAvailability;
        });
    }, [availabilityFilter, events, search]);

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                        Available Events
                    </h1>
                </div>
                <p className="text-sm text-muted-foreground">
                    {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"}
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                <Input
                    type="search"
                    placeholder="Search events"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
                <Select
                    value={availabilityFilter}
                    onValueChange={setAvailabilityFilter}
                >
                    <SelectTrigger aria-label="Filter events by availability">
                        <SelectValue placeholder="All events" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All events</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="sold-out">Sold out</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {events.length === 0 ? (
                <Card>
                    <CardContent className="p-6 text-sm text-muted-foreground">
                    No events yet.
                    </CardContent>
                </Card>
            ) : filteredEvents.length === 0 ? (
                <Card>
                    <CardContent className="p-6 text-sm text-muted-foreground">
                        No events match your search.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {filteredEvents.map((event) => {
                        const availableSeats = getAvailableSeats(event);
                        const isSoldOut = availableSeats === 0;

                        return (
                            <Card
                                key={event._id}
                                className={cn(
                                    "flex aspect-square min-h-0 flex-col transition",
                                    isSoldOut ? "opacity-70" : "hover:border-primary/40 hover:shadow-md"
                                )}
                            >
                                <CardHeader className="min-h-0 flex-1 overflow-hidden p-3">
                                    <CardTitle className="line-clamp-1 text-sm">
                                        {event.title}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 overflow-hidden break-words text-xs leading-4">
                                        {event.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="shrink-0 p-3">
                                    <div className="flex flex-wrap gap-1">
                                        <Badge variant="secondary" className="text-[0.68rem]">
                                            {formatEventDateTime(event.date, event.time)}
                                        </Badge>
                                        <Badge variant="amber" className="text-[0.68rem]">
                                            Rs. {Number(event.price).toLocaleString("en-IN")}
                                        </Badge>
                                        {isSoldOut ? (
                                            <Badge variant="destructive" className="text-[0.68rem]">
                                                Sold out
                                            </Badge>
                                        ) : (
                                            <Badge className="border-green-200 bg-green-100 text-[0.68rem] text-green-700">
                                                {availableSeats} seats available
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>

                                <CardFooter className="mt-auto shrink-0 p-3 pt-0">
                                    {isSoldOut ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="xs"
                                            className="w-fit"
                                            disabled
                                        >
                                            Sold Out
                                        </Button>
                                    ) : (
                                        <Button asChild variant="outline" size="xs" className="w-fit">
                                            <Link to={`/events/${event._id}`}>Book Now</Link>
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default Events;
