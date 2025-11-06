import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import { useState, ChangeEvent, FormEvent } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2, CalendarDays, Image as ImageIcon } from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Manage Events",
    href: "/manager/manage-events",
  },
];

export default function ManageEventsPage() {
  const [events, setEvents] = useState([
    {
      id: 1,
      name: "Community Clean-Up Drive",
      date: "2025-11-10",
      location: "City Park",
      status: "Active",
      poster: null as string | null,
    },
    {
      id: 2,
      name: "Food Donation Week",
      date: "2025-01-15",
      location: "Community Hall",
      status: "Active",
      poster: null as string | null,
    },
  ]);

  const [form, setForm] = useState({
    name: "",
    date: "",
    location: "",
    poster: null as File | null,
    preview: "",
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Handle poster upload
  const handlePosterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({
        ...form,
        poster: file,
        preview: URL.createObjectURL(file),
      });
    }
  };

  // Handle add/edit submit
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.date || !form.location) {
      alert("⚠️ Please fill all fields.");
      return;
    }

    if (editingId) {
      // Update event
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === editingId
            ? {
                ...ev,
                ...form,
                poster: form.preview || ev.poster,
              }
            : ev
        )
      );
      setEditingId(null);
    } else {
      // Add new event
      const newEvent = {
        id: events.length + 1,
        name: form.name,
        date: form.date,
        location: form.location,
        status: "Active",
        poster: form.preview,
      };
      setEvents([...events, newEvent]);
    }

    setForm({ name: "", date: "", location: "", poster: null, preview: "" });
    setIsAdding(false);
  };

  const handleEdit = (eventId: number) => {
    const ev = events.find((x) => x.id === eventId);
    if (ev) {
      setForm({
        name: ev.name,
        date: ev.date,
        location: ev.location,
        poster: null,
        preview: ev.poster || "",
      });
      setEditingId(ev.id);
      setIsAdding(true);
    }
  };

  const handleDelete = (eventId: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      setEvents(events.filter((ev) => ev.id !== eventId));
    }
  };

  const handleToggleStatus = (eventId: number) => {
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? { ...ev, status: ev.status === "Active" ? "Closed" : "Active" }
          : ev
      )
    );
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Manage Events" />

      <div className="flex flex-col gap-6 p-4 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
            Manage Events
          </h1>
          <Button onClick={() => setIsAdding(!isAdding)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            {isAdding ? "Cancel" : "Add Event"}
          </Button>
        </div>

        {/* Add/Edit Form */}
        {isAdding && (
          <Card className="border-dashed border-2">
            <CardHeader>
              <CardTitle>{editingId ? "Edit Event" : "Add New Event"}</CardTitle>
              <CardDescription>
                Fill in event details below to {editingId ? "update" : "create"}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium">Event Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter event name"
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) =>
                        setForm({ ...form, date: e.target.value })
                      }
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Location</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) =>
                        setForm({ ...form, location: e.target.value })
                      }
                      placeholder="Event location"
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" /> Event Poster
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePosterChange}
                    className="mt-1 block w-full text-sm"
                  />

                  {form.preview && (
                    <img
                      src={form.preview}
                      alt="Event Poster Preview"
                      className="mt-2 w-40 rounded-md border object-cover"
                    />
                  )}
                </div>

                <Button type="submit" className="self-end">
                  {editingId ? "Update Event" : "Add Event"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Event List */}
        <Card>
          <CardHeader>
            <CardTitle>Event List</CardTitle>
            <CardDescription>
              View and manage your events, posters, and details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Poster</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Location</th>
                    <th className="px-4 py-2 text-center">Status</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-2">
                        {ev.poster ? (
                          <img
                            src={ev.poster}
                            alt="poster"
                            className="w-16 h-16 object-cover rounded-md border"
                          />
                        ) : (
                          <div className="w-16 h-16 flex items-center justify-center border rounded-md text-gray-400 text-xs">
                            No Image
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">{ev.name}</td>
                      <td className="px-4 py-2">{ev.date}</td>
                      <td className="px-4 py-2">{ev.location}</td>
                      <td className="px-4 py-2 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(ev.id)}
                          className={`${
                            ev.status === "Active"
                              ? "text-green-600 border-green-400"
                              : "text-gray-500 border-gray-400"
                          }`}
                        >
                          {ev.status}
                        </Button>
                      </td>
                      <td className="px-4 py-2 text-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(ev.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(ev.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
