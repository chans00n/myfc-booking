"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTimeBlock } from "@/lib/availability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const timeBlockSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  blockType: z.enum(["vacation", "break", "personal", "holiday"]),
});

type TimeBlockFormData = z.infer<typeof timeBlockSchema>;

interface TimeBlockFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  defaultDate?: Date;
  defaultStartTime?: string;
  defaultEndTime?: string;
}

export function TimeBlockForm({
  onSuccess,
  onCancel,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
}: TimeBlockFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TimeBlockFormData>({
    resolver: zodResolver(timeBlockSchema),
    defaultValues: {
      date: defaultDate ? defaultDate.toISOString().split("T")[0] : "",
      startTime: defaultStartTime || "",
      endTime: defaultEndTime || "",
      blockType: "personal",
    },
  });

  const onSubmit = async (data: TimeBlockFormData) => {
    setLoading(true);

    // Combine date and time
    const startDatetime = new Date(`${data.date}T${data.startTime}`);
    const endDatetime = new Date(`${data.date}T${data.endTime}`);

    const result = await createTimeBlock(data.title, startDatetime, endDatetime, data.blockType);

    if (result) {
      toast({
        title: "Success",
        description: "Time block created successfully",
      });
      onSuccess();
    } else {
      toast({
        title: "Error",
        description: "Failed to create time block",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="e.g., Lunch break, Doctor's appointment"
          {...register("title")}
        />
        {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="blockType">Type</Label>
        <Select
          onValueChange={(value) => setValue("blockType", value as any)}
          defaultValue="personal"
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="break">Break</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="vacation">Vacation</SelectItem>
            <SelectItem value="holiday">Holiday</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...register("date")} />
          {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input id="startTime" type="time" {...register("startTime")} />
          {errors.startTime && <p className="text-sm text-red-500">{errors.startTime.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input id="endTime" type="time" {...register("endTime")} />
          {errors.endTime && <p className="text-sm text-red-500">{errors.endTime.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Time Block
        </Button>
      </div>
    </form>
  );
}
