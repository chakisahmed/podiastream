"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Patient, PatientInput } from "@/types/patient";

const schema = z.object({
  first_name: z.string().min(1, "Prénom requis"),
  last_name: z.string().min(1, "Nom requis"),
  date_of_birth: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  profession: z.string().optional().or(z.literal("")),
  shoe_size: z.string().optional().or(z.literal("")),
  referring_doctor: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  allergies: z.string().optional().or(z.literal("")),
  medical_background: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

function toDefaults(patient?: Patient): FormValues {
  return {
    first_name: patient?.first_name ?? "",
    last_name: patient?.last_name ?? "",
    date_of_birth: patient?.date_of_birth ?? "",
    phone: patient?.phone ?? "",
    email: patient?.email ?? "",
    profession: patient?.profession ?? "",
    shoe_size: patient?.shoe_size ?? "",
    referring_doctor: patient?.referring_doctor ?? "",
    address: patient?.address ?? "",
    allergies: patient?.allergies ?? "",
    medical_background: patient?.medical_background ?? "",
  };
}

const FIELD_LABEL =
  "font-label-sm text-label-sm text-on-surface-variant mb-1 block";
const INPUT_CLASS = "glass-input rounded-lg px-3 py-2 text-on-surface w-full";

export function PatientForm({
  patient,
  onSubmit,
  submitLabel,
  pending,
}: {
  patient?: Patient;
  onSubmit: (values: PatientInput) => void | Promise<void>;
  submitLabel: string;
  pending?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toDefaults(patient),
  });

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values as PatientInput))}
      className="glass-panel rounded-xl p-container-padding flex flex-col gap-gutter"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        <div>
          <label className={FIELD_LABEL}>Prénom *</label>
          <input className={INPUT_CLASS} {...register("first_name")} />
          {errors.first_name && (
            <p className="text-error font-body-sm text-body-sm mt-1">
              {errors.first_name.message}
            </p>
          )}
        </div>
        <div>
          <label className={FIELD_LABEL}>Nom *</label>
          <input className={INPUT_CLASS} {...register("last_name")} />
          {errors.last_name && (
            <p className="text-error font-body-sm text-body-sm mt-1">
              {errors.last_name.message}
            </p>
          )}
        </div>
        <div>
          <label className={FIELD_LABEL}>Date de naissance</label>
          <input type="date" className={INPUT_CLASS} {...register("date_of_birth")} />
        </div>
        <div>
          <label className={FIELD_LABEL}>Téléphone</label>
          <input className={INPUT_CLASS} {...register("phone")} />
        </div>
        <div>
          <label className={FIELD_LABEL}>Email</label>
          <input type="email" className={INPUT_CLASS} {...register("email")} />
          {errors.email && (
            <p className="text-error font-body-sm text-body-sm mt-1">
              {errors.email.message}
            </p>
          )}
        </div>
        <div>
          <label className={FIELD_LABEL}>Profession</label>
          <input className={INPUT_CLASS} {...register("profession")} />
        </div>
        <div>
          <label className={FIELD_LABEL}>Pointure</label>
          <input className={INPUT_CLASS} {...register("shoe_size")} placeholder="ex : 42.5" />
        </div>
        <div>
          <label className={FIELD_LABEL}>Médecin traitant</label>
          <input className={INPUT_CLASS} {...register("referring_doctor")} />
        </div>
      </div>

      <div>
        <label className={FIELD_LABEL}>Adresse</label>
        <textarea className={INPUT_CLASS} rows={2} {...register("address")} />
      </div>
      <div>
        <label className={FIELD_LABEL}>Allergies</label>
        <textarea className={INPUT_CLASS} rows={2} {...register("allergies")} />
      </div>
      <div>
        <label className={FIELD_LABEL}>Antécédents médicaux</label>
        <textarea
          className={INPUT_CLASS}
          rows={3}
          {...register("medical_background")}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-on-primary rounded-lg py-2 font-label-md hover:bg-primary/90 transition-colors disabled:opacity-60 self-start px-6"
      >
        {pending ? "Enregistrement..." : submitLabel}
      </button>
    </form>
  );
}
