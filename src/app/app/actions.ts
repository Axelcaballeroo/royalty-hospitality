"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/current-business";
import { applyLoyaltyPoints } from "@/lib/loyalty";
import { generateLoyaltyCode } from "@/lib/loyalty-code";
import { getSegmentCustomers } from "@/lib/marketing";

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

async function createUniqueLoyaltyCode(input: {
  businessId: string;
  prefixSource: string;
}) {
  const supabase = await createClient();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateLoyaltyCode(input.prefixSource);
    const { data } = await supabase
      .from("customers")
      .select("id")
      .eq("business_id", input.businessId)
      .eq("loyalty_code", code)
      .maybeSingle<{ id: string }>();

    if (!data) {
      return code;
    }
  }

  return `${generateLoyaltyCode(input.prefixSource)}-${Date.now().toString().slice(-4)}`;
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
      loyalty_code: await createUniqueLoyaltyCode({
        businessId: current.businessId,
        prefixSource: current.business.slug,
      }),
      loyalty_enabled: true,
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
    description: `Se creo el cliente ${fullName}`,
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
        loyalty_code: await createUniqueLoyaltyCode({
          businessId: current.businessId,
          prefixSource: current.business.slug,
        }),
        loyalty_enabled: true,
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

    try {
      await applyLoyaltyPoints({
        businessId: current.businessId,
        customerId,
        pointsDelta: 10,
        type: "earn",
        description: "Puntos por visita completada",
        createdBy: current.userId,
      });

      await addCustomerEvent({
        businessId: current.businessId,
        customerId,
        type: "points_earned",
        title: "Puntos acumulados",
        description: "El cliente gano 10 puntos por visita completada",
        reservationId: id,
      });
    } catch (loyaltyError) {
      redirect(`/app/reservas?error=${encodeURIComponent(loyaltyError instanceof Error ? loyaltyError.message : "loyalty_points_failed")}`);
    }
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
    description:
      existingReservation
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

export async function updatePublicWebsiteSettingsAction(formData: FormData) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("businesses")
    .update({
      public_description: requiredString(formData, "public_description") || null,
      logo_url: requiredString(formData, "logo_url") || null,
      cover_url: requiredString(formData, "cover_url") || null,
      brand_primary_color: requiredString(formData, "brand_primary_color") || null,
      brand_secondary_color: requiredString(formData, "brand_secondary_color") || null,
      phone: requiredString(formData, "phone") || null,
      email: requiredString(formData, "email") || null,
      address: requiredString(formData, "address") || null,
      city: requiredString(formData, "city") || null,
      country: requiredString(formData, "country") || null,
      instagram_url: requiredString(formData, "instagram_url") || null,
      facebook_url: requiredString(formData, "facebook_url") || null,
      whatsapp_url: requiredString(formData, "whatsapp_url") || null,
      website_enabled: formData.get("website_enabled") === "on",
      reservation_enabled: formData.get("reservation_enabled") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.businessId);

  if (error) {
    redirect(`/app/configuracion?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/app/configuracion");
  revalidatePath(`/site/${current.business.slug}`);
  redirect("/app/configuracion?success=public_settings_updated");
}

export async function createRewardAction(formData: FormData) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const name = requiredString(formData, "name");
  const pointsRequired = Number(requiredString(formData, "points_required"));

  if (!name || !pointsRequired || pointsRequired <= 0) {
    redirect("/app/fidelizacion?error=reward_validation");
  }

  const { error } = await supabase.from("rewards").insert({
    business_id: current.businessId,
    name,
    description: requiredString(formData, "description") || null,
    points_required: pointsRequired,
    status: requiredString(formData, "status") || "active",
  });

  if (error) {
    redirect(`/app/fidelizacion?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/app/fidelizacion");
  redirect("/app/fidelizacion?success=reward_created");
}

export async function adjustLoyaltyPointsAction(formData: FormData) {
  const current = await getCurrentBusiness();
  const customerId = requiredString(formData, "customer_id");
  const points = Number(requiredString(formData, "points"));
  const reason = requiredString(formData, "reason");
  const returnTo = requiredString(formData, "return_to") || "/app/fidelizacion";

  if (!customerId || !points || !reason) {
    redirect(`${returnTo}?error=points_adjustment_validation`);
  }

  try {
    await applyLoyaltyPoints({
      businessId: current.businessId,
      customerId,
      pointsDelta: points,
      type: "adjustment",
      description: reason,
      createdBy: current.userId,
    });

    await addCustomerEvent({
      businessId: current.businessId,
      customerId,
      type: "points_adjusted",
      title: "Puntos ajustados",
      description: `${points} puntos: ${reason}`,
    });
  } catch (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(error instanceof Error ? error.message : "points_adjustment_failed")}`);
  }

  revalidatePath(returnTo);
  redirect(`${returnTo}?success=points_adjusted`);
}

export async function redeemRewardAction(formData: FormData) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const customerId = requiredString(formData, "customer_id");
  const rewardId = requiredString(formData, "reward_id");
  const returnTo = requiredString(formData, "return_to") || `/app/clientes/${customerId}`;

  if (!customerId || !rewardId) {
    redirect(`${returnTo}?error=reward_validation`);
  }

  const [accountResult, rewardResult] = await Promise.all([
    supabase
      .from("loyalty_accounts")
      .select("points_balance")
      .eq("business_id", current.businessId)
      .eq("customer_id", customerId)
      .maybeSingle<{ points_balance: number }>(),
    supabase
      .from("rewards")
      .select("name, points_required")
      .eq("business_id", current.businessId)
      .eq("id", rewardId)
      .eq("status", "active")
      .maybeSingle<{ name: string; points_required: number }>(),
  ]);

  const pointsBalance = accountResult.data?.points_balance ?? 0;
  const reward = rewardResult.data;

  if (!reward) {
    redirect(`${returnTo}?error=reward_not_found`);
  }

  if (pointsBalance < reward.points_required) {
    redirect(`${returnTo}?error=insufficient_points`);
  }

  try {
    await applyLoyaltyPoints({
      businessId: current.businessId,
      customerId,
      pointsDelta: -reward.points_required,
      type: "redeem",
      description: `Canje de recompensa: ${reward.name}`,
      createdBy: current.userId,
    });

    await addCustomerEvent({
      businessId: current.businessId,
      customerId,
      type: "reward_redeemed",
      title: "Recompensa canjeada",
      description: `${reward.name} por ${reward.points_required} puntos`,
    });
  } catch (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(error instanceof Error ? error.message : "reward_redeem_failed")}`);
  }

  revalidatePath(returnTo);
  revalidatePath("/app/fidelizacion");
  redirect(`${returnTo}?success=reward_redeemed`);
}

export async function registerConsumptionAction(formData: FormData) {
  const current = await getCurrentBusiness();
  const customerId = requiredString(formData, "customer_id");
  const amount = Number(requiredString(formData, "amount"));
  const comment = requiredString(formData, "comment");
  const returnTo = requiredString(formData, "return_to") || "/app/fidelizacion/check-in";

  if (!customerId || !amount || amount <= 0) {
    redirect(`${returnTo}?error=consumption_validation`);
  }

  const points = Math.floor(amount);

  try {
    await applyLoyaltyPoints({
      businessId: current.businessId,
      customerId,
      pointsDelta: points,
      type: "earn",
      description: comment ? `Consumo registrado: ${comment}` : "Consumo registrado",
      createdBy: current.userId,
    });

    await addCustomerEvent({
      businessId: current.businessId,
      customerId,
      type: "points_earned",
      title: "Puntos acumulados",
      description: `Cliente acumulo ${points} puntos por consumo.`,
    });
  } catch (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(error instanceof Error ? error.message : "consumption_failed")}`);
  }

  revalidatePath(returnTo);
  revalidatePath("/app/fidelizacion");
  redirect(`${returnTo}?success=consumption_registered`);
}

export async function createMessageTemplateAction(formData: FormData) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const name = requiredString(formData, "name");
  const type = requiredString(formData, "type");
  const message = requiredString(formData, "message");

  if (!name || !type || !message) {
    redirect("/app/marketing?error=template_validation");
  }

  const { error } = await supabase.from("message_templates").insert({
    business_id: current.businessId,
    name,
    type,
    message,
    status: requiredString(formData, "status") || "active",
    created_by: current.userId,
  });

  if (error) {
    redirect(`/app/marketing?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/app/marketing");
  redirect("/app/marketing?success=template_created");
}

export async function createCampaignAction(formData: FormData) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const name = requiredString(formData, "name");
  const type = requiredString(formData, "type");
  const segmentKey = requiredString(formData, "segment_key");
  const channel = requiredString(formData, "channel") || "manual";
  const message = requiredString(formData, "message");
  const action = requiredString(formData, "campaign_action");
  const scheduledAt = requiredString(formData, "scheduled_at");

  if (!name || !type || !segmentKey || !message) {
    redirect("/app/marketing?error=campaign_validation");
  }

  const status = action === "schedule" ? "scheduled" : "draft";
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      business_id: current.businessId,
      name,
      type,
      segment_key: segmentKey,
      channel,
      message,
      status,
      scheduled_at: status === "scheduled" ? scheduledAt || new Date().toISOString() : null,
      created_by: current.userId,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    redirect(`/app/marketing?error=${encodeURIComponent(error?.message ?? "campaign_failed")}`);
  }

  if (action === "send") {
    redirect(`/app/marketing/${data.id}?send=1`);
  }

  revalidatePath("/app/marketing");
  redirect(`/app/marketing/${data.id}?success=campaign_created`);
}

export async function sendCampaignAction(formData: FormData) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const campaignId = requiredString(formData, "campaign_id");

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name, segment_key, channel")
    .eq("business_id", current.businessId)
    .eq("id", campaignId)
    .maybeSingle<{ id: string; name: string; segment_key: string; channel: string }>();

  if (!campaign) {
    redirect("/app/marketing?error=campaign_not_found");
  }

  const customers = await getSegmentCustomers({
    businessId: current.businessId,
    segmentKey: campaign.segment_key,
  });
  const now = new Date().toISOString();

  if (customers.length) {
    const { error: recipientsError } = await supabase
      .from("campaign_recipients")
      .upsert(
        customers.map((customer) => ({
          business_id: current.businessId,
          campaign_id: campaign.id,
          customer_id: customer.id,
          status: "sent",
          sent_at: now,
        })),
        { onConflict: "campaign_id,customer_id" },
      );

    if (recipientsError) {
      redirect(`/app/marketing/${campaign.id}?error=${encodeURIComponent(recipientsError.message)}`);
    }

    await supabase.from("customer_events").insert(
      customers.map((customer) => ({
        business_id: current.businessId,
        customer_id: customer.id,
        type: "campaign_sent",
        title: "Campana enviada",
        description: `${campaign.name} / ${campaign.channel}`,
        created_by: current.userId,
      })),
    );
  }

  const { error } = await supabase
    .from("campaigns")
    .update({
      status: "sent",
      sent_at: now,
      updated_at: now,
    })
    .eq("business_id", current.businessId)
    .eq("id", campaign.id);

  if (error) {
    redirect(`/app/marketing/${campaign.id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/app/marketing");
  revalidatePath(`/app/marketing/${campaign.id}`);
  redirect(`/app/marketing/${campaign.id}?success=campaign_sent`);
}

export async function updateCampaignRecipientStatusAction(formData: FormData) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const campaignId = requiredString(formData, "campaign_id");
  const recipientId = requiredString(formData, "recipient_id");
  const status = requiredString(formData, "status");
  const now = new Date().toISOString();

  const timestampFieldByStatus: Record<string, string> = {
    opened: "opened_at",
    clicked: "clicked_at",
    redeemed: "redeemed_at",
  };
  const updatePayload: Record<string, string> = { status };

  if (timestampFieldByStatus[status]) {
    updatePayload[timestampFieldByStatus[status]] = now;
  }

  const { data: recipient, error } = await supabase
    .from("campaign_recipients")
    .update(updatePayload)
    .eq("business_id", current.businessId)
    .eq("id", recipientId)
    .select("customer_id")
    .maybeSingle<{ customer_id: string }>();

  if (error) {
    redirect(`/app/marketing/${campaignId}?error=${encodeURIComponent(error.message)}`);
  }

  if (status === "redeemed" && recipient?.customer_id) {
    await addCustomerEvent({
      businessId: current.businessId,
      customerId: recipient.customer_id,
      type: "campaign_redeemed",
      title: "Campana canjeada",
      description: campaignId,
    });
  }

  revalidatePath(`/app/marketing/${campaignId}`);
  redirect(`/app/marketing/${campaignId}?success=recipient_updated`);
}
