"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/current-business";

const validReservationStatuses = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
];

function requiredString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

async function addCustomerEvent(input: {
  businessId: string;
  customerId: string;
  type: string;
  title: string;
  description?: string;
  reservationId?: string;
}) {
  const supabase = await createClient();
  const current = await getCurrentBusiness();

  await supabase.from("customer_events").insert({
    business_id: input.businessId,
    customer_id: input.customerId,
    reservation_id: input.reservationId ?? null,
    type: input.type,
    title: input.title,
    description: input.description ?? null,
    created_by: current.userId,
  });
}

export async function createCustomerAction(formData: FormData) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const fullName = requiredString(formData, "full_name");
  const phone = requiredString(formData, "phone");
  const email = requiredString(formData, "email");

  if (!fullName || (!phone && !email)) {
    redirect("/app/clientes?error=customer_validation");
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({
      business_id: current.businessId,
      full_name: fullName,
      phone: phone || null,
      email: email || null,
      birthday: requiredString(formData, "birthday") || null,
      tags: parseTags(requiredString(formData, "tags")),
      notes: requiredString(formData, "notes") || null,
      status: "active",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    redirect(`/app/clientes?error=${encodeURIComponent(error?.message ?? "create_customer_failed")}`);
  }

  await addCustomerEvent({
    businessId: current.businessId,
    customerId: data.id,
    type: "customer_created",
    title: "Cliente creado",
    description: `Se creó el cliente ${fullName}`,
  });

  revalidatePath("/app/clientes");
  redirect(`/app/clientes/${data.id}`);
}

export async function updateCustomerAction(formData: FormData) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const id = requiredString(formData, "id");
  const fullName = requiredString(formData, "full_name");
  const phone = requiredString(formData, "phone");
  const email = requiredString(formData, "email");

  if (!id || !fullName || (!phone && !email)) {
    redirect(`/app/clientes/${id}?error=customer_validation`);
  }

  const { error } = await supabase
    .from("customers")
    .update({
      full_name: fullName,
      phone: phone || null,
      email: email || null,
      birthday: requiredString(formData, "birthday") || null,
      tags: parseTags(requiredString(formData, "tags")),
      notes: requiredString(formData, "notes") || null,
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", current.businessId)
    .eq("id", id);

  if (error) {
    redirect(`/app/clientes/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/app/clientes/${id}`);
  redirect(`/app/clientes/${id}?success=customer_updated`);
}

export async function createInternalNoteAction(formData: FormData) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const customerId = requiredString(formData, "customer_id");
  const reservationId = requiredString(formData, "reservation_id");
  const title = requiredString(formData, "title");
  const content = requiredString(formData, "content");

  if (!customerId || !title || !content) {
    redirect(`/app/clientes/${customerId}?error=note_validation`);
  }

  const { data, error } = await supabase
    .from("internal_notes")
    .insert({
      business_id: current.businessId,
      customer_id: customerId,
      reservation_id: reservationId || null,
      title,
      content,
      created_by: current.userId,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    redirect(`/app/clientes/${customerId}?error=${encodeURIComponent(error?.message ?? "note_failed")}`);
  }

  await addCustomerEvent({
    businessId: current.businessId,
    customerId,
    type: "note_added",
    title: "Nota interna agregada",
    description: title,
  });

  revalidatePath(`/app/clientes/${customerId}`);
  redirect(`/app/clientes/${customerId}?success=note_created`);
}

export async function createInternalTaskAction(formData: FormData) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const customerId = requiredString(formData, "customer_id");
  const title = requiredString(formData, "title");

  if (!customerId || !title) {
    redirect(`/app/clientes/${customerId}?error=task_validation`);
  }

  const priority = requiredString(formData, "priority") || "medium";
  const status = requiredString(formData, "status") || "pending";

  const { data, error } = await supabase
    .from("internal_tasks")
    .insert({
      business_id: current.businessId,
      customer_id: customerId,
      reservation_id: requiredString(formData, "reservation_id") || null,
      assigned_to: requiredString(formData, "assigned_to") || null,
      created_by: current.userId,
      title,
      description: requiredString(formData, "description") || null,
      priority,
      status,
      due_date: requiredString(formData, "due_date") || null,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    redirect(`/app/clientes/${customerId}?error=${encodeURIComponent(error?.message ?? "task_failed")}`);
  }

  await addCustomerEvent({
    businessId: current.businessId,
    customerId,
    type: "task_created",
    title: "Tarea interna creada",
    description: title,
  });

  revalidatePath(`/app/clientes/${customerId}`);
  redirect(`/app/clientes/${customerId}?success=task_created`);
}

export async function updateTaskStatusAction(formData: FormData) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const taskId = requiredString(formData, "task_id");
  const customerId = requiredString(formData, "customer_id");
  const status = requiredString(formData, "status");

  const { error } = await supabase
    .from("internal_tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("business_id", current.businessId)
    .eq("id", taskId);

  if (error) {
    redirect(`/app/clientes/${customerId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/app/clientes/${customerId}`);
  redirect(`/app/clientes/${customerId}?success=task_updated`);
}

export async function createInternalCommentAction(formData: FormData) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const customerId = requiredString(formData, "customer_id");
  const comment = requiredString(formData, "comment");

  if (!customerId || !comment) {
    redirect(`/app/clientes/${customerId}?error=comment_validation`);
  }

  const taskId = requiredString(formData, "task_id");
  const noteId = requiredString(formData, "note_id");

  if (!taskId && !noteId) {
    redirect(`/app/clientes/${customerId}?error=comment_target_required`);
  }

  const { error } = await supabase.from("internal_comments").insert({
    business_id: current.businessId,
    task_id: taskId || null,
    note_id: noteId || null,
    comment,
    created_by: current.userId,
  });

  if (error) {
    redirect(`/app/clientes/${customerId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/app/clientes/${customerId}`);
  redirect(`/app/clientes/${customerId}?success=comment_created`);
}

export async function createReservationAction(formData: FormData) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  let customerId = requiredString(formData, "customer_id");
  const date = requiredString(formData, "date");
  const time = requiredString(formData, "time");
  const partySize = Number(requiredString(formData, "party_size"));

  if (!date || !time || !partySize || partySize <= 0) {
    redirect("/app/reservas?error=reservation_validation");
  }

  if (!customerId) {
    const quickName = requiredString(formData, "quick_customer_name");
    const quickPhone = requiredString(formData, "quick_customer_phone");
    const quickEmail = requiredString(formData, "quick_customer_email");

    if (!quickName || (!quickPhone && !quickEmail)) {
      redirect("/app/reservas?error=customer_required");
    }

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({
        business_id: current.businessId,
        full_name: quickName,
        phone: quickPhone || null,
        email: quickEmail || null,
        status: "active",
      })
      .select("id")
      .single<{ id: string }>();

    if (customerError || !customer) {
      redirect(`/app/reservas?error=${encodeURIComponent(customerError?.message ?? "quick_customer_failed")}`);
    }

    customerId = customer.id;
    await addCustomerEvent({
      businessId: current.businessId,
      customerId,
      type: "customer_created",
      title: "Cliente creado desde reserva",
      description: quickName,
    });
  }

  const { data, error } = await supabase
    .from("reservations")
    .insert({
      business_id: current.businessId,
      customer_id: customerId,
      date,
      time,
      party_size: partySize,
      status: "pending",
      source: requiredString(formData, "source") || "manual",
      notes: requiredString(formData, "notes") || null,
      special_request: requiredString(formData, "special_request") || null,
      created_by: current.userId,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    redirect(`/app/reservas?error=${encodeURIComponent(error?.message ?? "reservation_failed")}`);
  }

  await addCustomerEvent({
    businessId: current.businessId,
    customerId,
    type: "reservation_created",
    title: "Reserva creada",
    description: `Reserva para ${partySize} personas el ${date} a las ${time}`,
    reservationId: data.id,
  });

  revalidatePath("/app/reservas");
  redirect("/app/reservas?success=reservation_created");
}

export async function updateReservationStatusAction(formData: FormData) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const id = requiredString(formData, "reservation_id");
  const customerId = requiredString(formData, "customer_id");
  const status = requiredString(formData, "status");

  if (!validReservationStatuses.includes(status)) {
    redirect("/app/reservas?error=invalid_status");
  }

  const { data: existingReservation } = await supabase
    .from("reservations")
    .select("status, date, time, party_size")
    .eq("business_id", current.businessId)
    .eq("id", id)
    .maybeSingle<{
      status: string;
      date: string;
      time: string;
      party_size: number;
    }>();

  const { error } = await supabase
    .from("reservations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("business_id", current.businessId)
    .eq("id", id);

  if (error) {
    redirect(`/app/reservas?error=${encodeURIComponent(error.message)}`);
  }

  if (status === "completed" && existingReservation?.status !== "completed") {
    const { data: customer } = await supabase
      .from("customers")
      .select("total_visits")
      .eq("business_id", current.businessId)
      .eq("id", customerId)
      .maybeSingle<{ total_visits: number }>();

    await supabase
      .from("customers")
      .update({
        total_visits: (customer?.total_visits ?? 0) + 1,
        last_visit_at: `${existingReservation?.date ?? new Date().toISOString().slice(0, 10)}T${existingReservation?.time ?? "00:00"}Z`,
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", current.businessId)
      .eq("id", customerId);
  }

  const eventTypeByStatus: Record<string, string> = {
    confirmed: "reservation_confirmed",
    cancelled: "reservation_cancelled",
    completed: "visit_completed",
    no_show: "reservation_no_show",
    pending: "reservation_created",
  };

  await addCustomerEvent({
    businessId: current.businessId,
    customerId,
    type: eventTypeByStatus[status],
    title: `Reserva ${status}`,
    description: existingReservation
      ? `Reserva para ${existingReservation.party_size} personas el ${existingReservation.date} a las ${existingReservation.time}`
      : undefined,
    reservationId: id,
  });

  revalidatePath("/app/reservas");
  redirect("/app/reservas?success=status_updated");
}

export async function updateReservationAction(formData: FormData) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const id = requiredString(formData, "reservation_id");
  const partySize = Number(requiredString(formData, "party_size"));

  if (!id || !requiredString(formData, "date") || !requiredString(formData, "time") || partySize <= 0) {
    redirect("/app/reservas?error=reservation_validation");
  }

  const { error } = await supabase
    .from("reservations")
    .update({
      date: requiredString(formData, "date"),
      time: requiredString(formData, "time"),
      party_size: partySize,
      notes: requiredString(formData, "notes") || null,
      special_request: requiredString(formData, "special_request") || null,
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", current.businessId)
    .eq("id", id);

  if (error) {
    redirect(`/app/reservas?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/app/reservas");
  redirect("/app/reservas?success=reservation_updated");
}
