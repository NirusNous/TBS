import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatEventDateTime } from "@/lib/dateTime";
import API from "../api/axios";

const getAvailableSeats = (event) => {
    return event.seats?.filter(seat => !seat.isBooked).length || 0;
};

const getTodayInputValue = () => {
    return new Date().toISOString().slice(0, 10);
};

const getDateInputValue = (date) => {
    if (!date) {
        return "";
    }

    return new Date(date).toISOString().slice(0, 10);
};

const isPastEventDateTime = (date, time) => {
    if (!date || !time) {
        return true;
    }

    const eventDateTime = new Date(`${date}T${time}`);

    return Number.isNaN(eventDateTime.getTime()) || eventDateTime <= new Date();
};

const Admin = () => {
    const [events, setEvents] = useState([]);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [eventSearch, setEventSearch] = useState("");
    const [availabilityFilter, setAvailabilityFilter] = useState("all");
    const [editingEvent, setEditingEvent] = useState(null);
    const [editError, setEditError] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [form, setForm] = useState({
        title: "",
        description: "",
        date: "",
        time: "",
        price: "",
    });

    const fetchEvents = useCallback(async () => {
        try {
            setError("");
            const res = await API.get("/events");
            setEvents(res.data.events);
        } catch (error) {
            setError(error.response?.data?.message || "Could not load events");
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        API.get("/events")
            .then(res => {
                if (isMounted) {
                    setEvents(res.data.events);
                }
            })
            .catch(error => {
                if (isMounted) {
                    setError(error.response?.data?.message || "Could not load events");
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const openEditModal = (event) => {
        setError("");
        setNotice("");
        setEditError("");
        setEditingEvent({
            ...event,
            form: {
                title: event.title || "",
                description: event.description || "",
                date: getDateInputValue(event.date),
                time: event.time || "",
                price: event.price?.toString() || "",
            },
        });
    };

    const closeEditModal = () => {
        if (isUpdating) {
            return;
        }

        setEditingEvent(null);
        setEditError("");
    };

    const handleEditChange = (e) => {
        setEditingEvent((currentEvent) => ({
            ...currentEvent,
            form: {
                ...currentEvent.form,
                [e.target.name]: e.target.value,
            },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setNotice("");

        const price = Number(form.price);

        if (Number.isNaN(price) || price < 0) {
            setError("Price cannot be negative.");
            return;
        }

        if (isPastEventDateTime(form.date, form.time)) {
            setError("Event date and time must be in the future.");
            return;
        }

        try {
            await API.post("/events", {
                ...form,
                price,
            });

            setForm({
                title: "",
                description: "",
                date: "",
                time: "",
                price: "",
            });
            fetchEvents();
            setNotice("Event created successfully.");
        } catch (error) {
            setError(error.response?.data?.message || "Event creation failed");
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        if (!editingEvent) {
            return;
        }

        setEditError("");
        setError("");
        setNotice("");

        const price = Number(editingEvent.form.price);

        if (Number.isNaN(price) || price < 0) {
            setEditError("Price cannot be negative.");
            return;
        }

        if (isPastEventDateTime(editingEvent.form.date, editingEvent.form.time)) {
            setEditError("Event date and time must be in the future.");
            return;
        }

        try {
            setIsUpdating(true);
            await API.put(`/events/${editingEvent._id}`, {
                ...editingEvent.form,
                price,
            });

            await fetchEvents();
            setEditingEvent(null);
            setNotice("Event updated successfully.");
        } catch (error) {
            setEditError(error.response?.data?.message || "Event update failed");
        } finally {
            setIsUpdating(false);
        }
    };

    const deleteEvent = async (eventId) => {
        try {
            setError("");
            setNotice("");
            await API.delete(`/events/${eventId}`);
            fetchEvents();
            setNotice("Event deleted successfully.");
        } catch (error) {
            setError(error.response?.data?.message || "Event delete failed");
        }
    };

    const filteredEvents = useMemo(() => {
        const normalizedSearch = eventSearch.trim().toLowerCase();

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
    }, [availabilityFilter, eventSearch, events]);

    return (
        <section className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            </div>

            {(error || notice) && (
                <div className="space-y-2">
                    {error && (
                        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                        </p>
                    )}
                    {notice && (
                        <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-blue-950">
                            {notice}
                        </p>
                    )}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Create Event</CardTitle>
                        <CardDescription>Add a new event with generated seats.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="event-title">Title</Label>
                                <Input
                                    id="event-title"
                                    name="title"
                                    placeholder="Event title"
                                    value={form.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="event-description">Description</Label>
                                <Textarea
                                    id="event-description"
                                    name="description"
                                    placeholder="Event description"
                                    value={form.description}
                                    onChange={handleChange}
                                    required
                                    rows={4}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="event-date">Date</Label>
                                    <Input
                                        id="event-date"
                                        name="date"
                                        type="date"
                                        min={getTodayInputValue()}
                                        value={form.date}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="event-time">Time</Label>
                                    <Input
                                        id="event-time"
                                        name="time"
                                        type="time"
                                        value={form.time}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="event-price">Price</Label>
                                <Input
                                    id="event-price"
                                    name="price"
                                    type="number"
                                    min="0"
                                    placeholder="Price"
                                    value={form.price}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full">
                                Create Event
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <div className="flex items-end justify-between gap-4">
                        <h2 className="text-xl font-semibold tracking-tight">Events</h2>
                        <p className="text-sm text-muted-foreground">
                            {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"}
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[1fr_170px]">
                        <Input
                            type="search"
                            placeholder="Search events"
                            value={eventSearch}
                            onChange={(event) => setEventSearch(event.target.value)}
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
                        <div className="space-y-3">
                            {filteredEvents.map(event => (
                                <Card
                                    key={event._id}
                                    className="h-36 transition hover:border-primary/40"
                                >
                                    <CardContent className="flex h-full p-5">
                                        <div className="flex min-h-0 w-full flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0 flex-1 space-y-2 overflow-hidden">
                                            <h3 className="line-clamp-1 text-lg font-semibold tracking-tight">
                                                {event.title}
                                            </h3>
                                            <p className="line-clamp-2 overflow-hidden break-words text-sm leading-5 text-muted-foreground">
                                                {event.description}
                                            </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge variant="secondary">
                                                        {formatEventDateTime(event.date, event.time)}
                                                    </Badge>
                                                    <Badge variant="amber">
                                                        Rs. {Number(event.price).toLocaleString("en-IN")}
                                                    </Badge>
                                                </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon-sm"
                                                aria-label={`Edit ${event.title}`}
                                                title="Edit event"
                                                onClick={() => openEditModal(event)}
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="destructive"
                                                        size="icon-sm"
                                                        aria-label={`Delete ${event.title}`}
                                                        title="Delete event"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will delete "{event.title}" and all related bookings. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            variant="destructive"
                                                            onClick={() => deleteEvent(event._id)}
                                                        >
                                                            Delete event
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={Boolean(editingEvent)} onOpenChange={(open) => !open && closeEditModal()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Event</DialogTitle>
                        <DialogDescription>
                            Update the event details. Existing bookings and seats will stay unchanged.
                        </DialogDescription>
                    </DialogHeader>

                    {editingEvent && (
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            {editError && (
                                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                    {editError}
                                </p>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="edit-event-title">Title</Label>
                                <Input
                                    id="edit-event-title"
                                    name="title"
                                    placeholder="Event title"
                                    value={editingEvent.form.title}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-event-description">Description</Label>
                                <Textarea
                                    id="edit-event-description"
                                    name="description"
                                    placeholder="Event description"
                                    value={editingEvent.form.description}
                                    onChange={handleEditChange}
                                    required
                                    rows={4}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-event-date">Date</Label>
                                    <Input
                                        id="edit-event-date"
                                        name="date"
                                        type="date"
                                        min={getTodayInputValue()}
                                        value={editingEvent.form.date}
                                        onChange={handleEditChange}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-event-time">Time</Label>
                                    <Input
                                        id="edit-event-time"
                                        name="time"
                                        type="time"
                                        value={editingEvent.form.time}
                                        onChange={handleEditChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-event-price">Price</Label>
                                <Input
                                    id="edit-event-price"
                                    name="price"
                                    type="number"
                                    min="0"
                                    placeholder="Price"
                                    value={editingEvent.form.price}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>

                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeEditModal}
                                    disabled={isUpdating}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isUpdating}>
                                    {isUpdating ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
};

export default Admin;
