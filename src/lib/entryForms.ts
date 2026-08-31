// Config-driven entry forms — exact section + field layout from the reference site.
// Each form maps its fields directly to a Supabase table's columns.

export type FieldType = "text" | "number" | "date" | "select" | "radio" | "currency";

export type FormField = {
  key: string;
  label: string;
  required?: boolean;
  type?: FieldType; // default "text"
  options?: string[];
  full?: boolean; // field spans full row
  placeholder?: string;
};

export type FormSection = { title: string; fields: FormField[] };

export type EntryFormDef = {
  slug: string;
  title: string;
  table: string;
  sections: FormSection[];
};

const t = (key: string, label: string, opts: Partial<FormField> = {}): FormField => ({
  key,
  label,
  type: "text",
  ...opts,
});

// Shared transport/diesel sub-sections used by Sales / Rent / Day Fees
const TRANSPORT_SECTION: FormSection = {
  title: "Transport Details",
  fields: [
    t("vehicle_number", "Vehicle Number", { required: true }),
    t("driver_name", "Driver Name", { required: true }),
    t("driver_padi", "Driver Padi", { type: "number", required: true }),
    t("driver_food_amount", "Driver Food Amount", { type: "number" }),
    t("shed_work_amount", "Shed Work Amount", { type: "number" }),
    t("total_vehicle_expense", "Total Vehicle Expense", { type: "number" }),
    t("driver_advance", "Driver Advance", { type: "number" }),
    t("choose_account", "Choose Account"),
    t("driver_net_total", "Driver Net Total", { type: "number" }),
  ],
};

const DIESEL_SECTION: FormSection = {
  title: "Diesel Entry Details",
  fields: [
    t("diesel_source", "Diesel Source", { type: "select", options: ["Own bunk", "Rent"] }),
    t("diesel_rate_per_liter", "Diesel Rate Per Liter", { type: "number" }),
    t("diesel_liters", "Diesel Liters", { type: "number" }),
    t("from_km", "From KM", { type: "number" }),
    t("to_km", "To KM", { type: "number" }),
    t("total_km", "Total KM", { type: "number" }),
    t("mileage", "Mileage"),
    t("tank_status", "Tank Status", { type: "select", options: ["Refill", "Empty"] }),
    t("diesel_amount", "Diesel Amount", { type: "number", required: true }),
    t("bunk_reference", "Bunk Reference"),
    t("total_trip_expense", "Total Trip Expense", { type: "number" }),
    t("profit", "Profit", { type: "number" }),
  ],
};

const REPORT_FOR_SECTION: FormSection = {
  title: "Report For",
  fields: [
    t("report_for", "Report For"),
    t("report_from", "Report From", { type: "date" }),
    t("report_to", "Report To", { type: "date" }),
  ],
};

export const ENTRY_FORMS: EntryFormDef[] = [
  {
    slug: "add-sales-entry",
    title: "Add Sales Entry",
    table: "sales_entries",
    sections: [
      {
        title: "Basic Details",
        fields: [
          t("sales_id", "Sales ID"),
          t("entry_date", "Date", { type: "date" }),
          t("transporters", "Business Transporters", { required: true }),
          t("dc_no", "DC Number", { required: true }),
          t("contact_number", "Contact Number"),
        ],
      },
      {
        title: "Purchase Details (From Vendor)",
        fields: [
          t("purchase_from", "Purchase From", { required: true }),
          t("materials", "Materials", { required: true }),
          t("purchase_unit", "Purchase Unit", { required: true }),
          t("purchase_quantity", "Purchase Quantity", { type: "number", required: true }),
          t("purchase_rate", "Purchase Rate (Per Unit/Ton)", { type: "number", required: true }),
          t("purchase_total", "Purchase Total", { type: "number", required: true }),
          t("purchase_gst", "Purchase GST %", { type: "select", required: true, options: ["0", "5", "12", "18", "28"] }),
          t("purchase_gst_amount", "Purchase GST Amount", { type: "number" }),
          t("purchase_net_total", "Purchase Net Total", { type: "number" }),
          t("purchase_paid", "Purchase Paid", { type: "number" }),
          t("purchase_balance", "Purchase Balance", { type: "number" }),
        ],
      },
      {
        title: "Sales Details",
        fields: [
          t("client_name", "Client Name", { required: true }),
          t("delivery_location", "Delivery Location"),
          t("sales_unit", "Sales Unit", { required: true }),
          t("sales_quantity", "Sales Quantity", { type: "number", required: true }),
          t("sales_rate", "Sales Price (Per Unit/Ton)", { type: "number", required: true }),
          t("sales_total", "Sales Total", { type: "number" }),
          t("sales_gst", "Sales GST %", { type: "select", required: true, options: ["0", "5", "12", "18", "28"] }),
          t("sales_gst_amount", "Sales GST Amount", { type: "number" }),
          t("sales_net_total", "Sales Net Total", { type: "number" }),
        ],
      },
      {
        title: "Transport Details",
        fields: [
          t("vehicle", "Vehicle Number", { required: true }),
          t("driver", "Driver Name", { required: true }),
          t("driver_padi", "Driver Padi", { type: "number", required: true }),
          t("driver_food_amount", "Driver Food Amount", { type: "number" }),
          t("shed_work_amount", "Shed Work Amount", { type: "number" }),
          t("total_vehicle_expense", "Total Vehicle Expense", { type: "number" }),
          t("driver_advance", "Driver Advance", { type: "number" }),
          t("choose_account", "Choose Account"),
          t("driver_net_total", "Driver Net Total", { type: "number" }),
        ],
      },
      {
        title: "Diesel Entry Details",
        fields: [
          t("diesel_source", "Diesel Source", { type: "select", options: ["Own bunk", "Rent"] }),
          t("diesel_rate_per_liter", "Diesel Rate Per Liter", { type: "number" }),
          t("from_km", "From KM", { type: "number" }),
          t("to_km", "To KM", { type: "number" }),
          t("diesel_liters", "Diesel Liters", { type: "number" }),
          t("tank_status", "Tank Status", { type: "select", options: ["Refill", "Empty"] }),
          t("total_km", "Total KM", { type: "number" }),
          t("mileage", "Mileage", { type: "number" }),
          t("diesel_amount", "Diesel Amount", { type: "number" }),
          t("total_trip_expense", "Total Trip Expense", { type: "number" }),
        ],
      },
      {
        title: "Profit",
        fields: [t("profit", "Profit", { type: "number" })],
      },
      REPORT_FOR_SECTION,
    ],
  },
  {
    slug: "add-rent-entry",
    title: "Add Rent Entry",
    table: "rent_entries",
    sections: [
      {
        title: "Basic Details",
        fields: [
          t("rent_entry_id", "Rent Entry ID"),
          t("entry_date", "Date", { type: "date" }),
          t("transporters", "Business Transporters", { required: true }),
          t("purchase_from", "Purchase From", { required: true }),
          t("quantity", "Quantity", { type: "number", required: true }),
          t("dc_no", "DC Number", { required: true }),
          t("contact_number", "Contact Number"),
          t("material", "Material", { required: true }),
          t("unit", "Unit", { required: true }),
        ],
      },
      {
        title: "Rent Details",
        fields: [
          t("client_name", "Client Name", { required: true }),
          t("delivery_location", "Delivery Location"),
          t("rent_quantity", "Rent Quantity", { type: "number", required: true }),
          t("rent_price", "Rent Price (Per Unit/Ton)", { type: "number", required: true }),
          t("rent_amount", "Rent Amount", { type: "number", required: true }),
          t("rent_gst", "GST", { type: "select", options: ["0", "5", "12", "18", "28"] }),
          t("rent_gst_amount", "Rent GST Amount", { type: "number" }),
          t("rent_amount_with_gst", "Rent Amount with GST", { type: "number" }),
        ],
      },
      TRANSPORT_SECTION,
      DIESEL_SECTION,
      REPORT_FOR_SECTION,
    ],
  },
  {
    slug: "add-day-fees-entry",
    title: "Add Day Fees Entry",
    table: "day_fees_entries",
    sections: [
      {
        title: "Basic Details",
        fields: [
          t("zoho_id", "Day Fees Entry ID"),
          t("entry_date", "Date", { type: "date" }),
          t("transporters", "Business Transporters", { required: true }),
          t("purchase_from", "Purchase From", { required: true }),
          t("quantity", "Quantity", { type: "number", required: true }),
          t("dc_number", "DC Number", { required: true }),
          t("contact_number", "Contact Number"),
          t("material", "Material", { required: true }),
          t("unit", "Unit", { required: true }),
        ],
      },
      {
        title: "Day Fees Details",
        fields: [
          t("client_name", "Client Name", { required: true }),
          t("delivery_location", "Delivery Location"),
          t("total_load", "Total load", { type: "number", required: true }),
          t("per_day_amount", "Per Day amount", { type: "number", required: true }),
          t("gst", "GST", { type: "select", options: ["0", "5", "12", "18", "28"] }),
          t("gst_amount", "GST Amount", { type: "number" }),
          t("amount_with_gst", "Amount with GST", { type: "number" }),
        ],
      },
      {
        title: "Transport Details",
        fields: [
          t("vehicle_number", "Vehicle Number", { required: true }),
          t("driver_name", "Driver Name", { required: true }),
          t("driver_padi", "Driver Padi", { type: "number", required: true }),
          t("driver_food_amount", "Driver Food Amount", { type: "number" }),
          t("shed_work_amount", "Shed Work Amount", { type: "number" }),
          t("total_vehicle_expense", "Total Vehicle Expense", { type: "number" }),
          t("driver_advance", "Driver Advance", { type: "number" }),
          t("choose_account", "Choose Account"),
          t("driver_net_total", "Driver Net Total", { type: "number" }),
        ],
      },
      {
        title: "Diesel Entry Details",
        fields: [
          t("diesel_source", "Diesel Source", { type: "select", options: ["Own bunk", "Rent"] }),
          t("diesel_liters", "Diesel Liters", { type: "number" }),
          t("diesel_amount", "Diesel Amount", { type: "number" }),
          t("bunk_reference", "Bunk Reference"),
        ],
      },
      {
        title: "Profit",
        fields: [t("profit", "Profit", { type: "number" })],
      },
      REPORT_FOR_SECTION,
    ],
  },
  {
    slug: "add-boulders-entries",
    title: "Add Boulders Entries",
    table: "boulder_entries",
    sections: [
      {
        title: "Basic Details",
        fields: [
          t("zoho_id", "Boulder Entry ID"),
          t("entry_date", "Date", { type: "date" }),
          t("boulder_shift", "Boulder Shift", { type: "select", options: ["Day", "Night"] }),
          t("dc_number", "DC Number"),
          t("business_transporters", "Business Transporters", { required: true }),
        ],
      },
      {
        title: "Boulders Rent Details",
        fields: [
          t("client_name", "Client Name", { required: true }),
          t("delivery_location", "Delivery Location"),
          t("unit", "Unit", { required: true }),
          t("boulders_source", "Boulders Source"),
          t("total_loads", "Total Loads", { type: "number" }),
          t("total_tons", "Total Tons", { type: "number", required: true }),
          t("ton_per_rate", "Ton Per Rate", { type: "number", required: true }),
          t("amount", "Amount", { type: "number", required: true }),
          t("gst", "GST", { type: "select", options: ["0", "5", "12", "18", "28"] }),
          t("gst_amount", "GST Amount", { type: "number" }),
          t("amount_with_gst", "Amount with GST", { type: "number" }),
        ],
      },
      {
        title: "Transport Details",
        fields: [
          t("vehicle_number", "Vehicle Number", { required: true }),
          t("driver_name", "Driver Name", { required: true }),
          t("driver_padi", "Driver Padi", { type: "number", required: true }),
          t("driver_food_amount", "Driver Food Amount", { type: "number" }),
          t("shed_work_amount", "Shed Work Amount", { type: "number" }),
          t("total_vehicle_expense", "Total Vehicle Expense", { type: "number" }),
          t("driver_advance", "Driver Advance", { type: "number" }),
          t("choose_account", "Choose Account"),
          t("driver_net_total", "Driver Net Total", { type: "number" }),
        ],
      },
      {
        title: "Diesel Entry Details",
        fields: [
          t("diesel_source", "Diesel Source", { type: "select", options: ["Own bunk", "Rent"] }),
          t("diesel_rate_per_liter", "Diesel Rate Per Liter", { type: "number" }),
          t("from_km", "From KM", { type: "number" }),
          t("to_km", "To KM", { type: "number" }),
          t("diesel_liters", "Diesel Liters", { type: "number" }),
          t("tank_status", "Tank Status", { type: "select", options: ["Refill", "Empty"] }),
          t("total_km", "Total KM", { type: "number" }),
          t("diesel_amount", "Diesel Amount", { type: "number", required: true }),
          t("bunk_reference", "Bunk Reference"),
          t("mileage", "Mileage"),
        ],
      },
      {
        title: "Profit",
        fields: [
          t("total_trip_expense", "Total Trip Expense", { type: "number" }),
          t("profit", "Profit", { type: "number" }),
        ],
      },
      REPORT_FOR_SECTION,
    ],
  },
];

export const ENTRY_FORM_BY_SLUG = new Map(ENTRY_FORMS.map((f) => [f.slug, f]));

/** Map a report slug to its "add" form slug (when one exists). */
export const REPORT_TO_FORM: Record<string, string> = {
  "sales-entries": "add-sales-entry",
  "rent-entries": "add-rent-entry",
  "day-fees-entries": "add-day-fees-entry",
  "all-boulders-entries": "add-boulders-entries",
};
