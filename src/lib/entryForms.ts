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
  calculated?: boolean; // populated from the same inputs as the Zoho form
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
    t("total_vehicle_expense", "Total Vehicle Expense", { type: "number", calculated: true }),
    t("driver_advance", "Driver Advance", { type: "number" }),
    t("choose_account", "Choose Account"),
    t("driver_net_total", "Driver Net Total", { type: "number", calculated: true }),
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
    t("total_km", "Total KM", { type: "number", calculated: true }),
    t("mileage", "Mileage", { type: "number", calculated: true }),
    t("tank_status", "Tank Status", { type: "select", options: ["Refill", "Empty"] }),
    t("diesel_amount", "Diesel Amount", { type: "number", required: true, calculated: true }),
    t("bunk_reference", "Bunk Reference"),
    t("total_trip_expense", "Total Trip Expense", { type: "number", calculated: true }),
    t("profit", "Profit", { type: "number", calculated: true }),
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
  { slug:"add-income-expense-entry", title:"Income & Expense", table:"income_expense_entries", sections:[{title:"",fields:[t("payment_id","Payment ID"),t("business_transporters","Business Transporters",{required:true}),t("date_time","Date-Time"),t("payment_for","Payment For",{required:true}),t("type","Type",{type:"radio",options:["Income","Expense"],required:true}),t("category","Category",{required:true}),t("sales_entry_id","Sales Entry ID"),t("rent_entry_id","Rent Entry ID"),t("day_fees_entry_id","Day Fees Entry ID"),t("boulder_entry_id","Boulder Entry ID"),t("dc_number","DC Number"),t("vendor","Vendor"),t("client","Client"),t("driver","Driver"),t("vehicle","Vehicle"),t("account","Choose Account",{required:true}),t("income","Income Amount",{type:"number"}),t("expense","Expense Amount",{type:"number"}),t("remarks","Remarks",{full:true})]}] },
  { slug:"add-boulders-diesel-entry", title:"Diesel Entry", table:"boulder_diesel_entries", sections:[{title:"Basic Details",fields:[t("boulders_entries","Boulders Entries"),t("dc_number","DC Number"),t("zoho_id","Diesel Entry ID"),t("entry_date","Date",{type:"date",required:true}),t("vehicle","Vehicle"),t("driver","Driver"),t("source","Source",{type:"select",options:["Own bunk","Rent"]}),t("rec_from","From",{type:"radio",options:["Direct","Boulders"]}),t("diesel_rate_per_liter","Diesel Rate Per Liter",{type:"number"})]},{title:"KM Details",fields:[t("diesel_liters","Diesel Liters",{type:"number",required:true}),t("mileage","Mileage",{type:"number"}),t("diesel_amount","Diesel Amount",{type:"number",required:true}),t("bunk_reference","Bunk Reference"),t("tank_status","Tank Status",{type:"radio",options:["Full","Refill"]})]}] },
  { slug:"add-def-oil-entry", title:"Def Oil Entries", table:"def_oil_entries", sections:[{title:"Basic Details",fields:[t("date_time","Date-Time",{required:true}),t("business_transporters","Business Transporters",{required:true}),t("vehicle","Vehicle",{required:true}),t("driver","Driver",{required:true}),t("source","Source",{required:true}),t("def_oil_per_liter","Def Oil Per Liter",{type:"number",required:true})]},{title:"KM Details",fields:[t("from_km","From KM",{type:"number"}),t("to_km","To KM",{type:"number"}),t("total_km","Total KM",{type:"number",calculated:true}),t("def_oil_liters","Def Oil Liters",{type:"number",required:true}),t("mileage","Mileage",{type:"number",calculated:true}),t("def_oil_amount","Def Oil Amount",{type:"number",required:true,calculated:true}),t("bunk_reference","Bunk Reference"),t("tank_status","Tank Status",{type:"radio",options:["Full","Refill"]})]}] },
  { slug: "add-diesel-entry", title: "Diesel Entry", table: "diesel_entries", sections: [
    { title: "Basic Details", fields: [t("sales_entry_id","Sales"),t("rent_entry_id","Rent Entry"),t("day_fees_entry_id","Day Fees Entry"),t("excavator_id","Excavators"),t("excavator_rent_entry_id","Excavators Rent Entries"),t("excavator_daily_entry_id","Excavators Daily Entries"),t("boulders_entries","Boulders Entries"),t("dc_number","DC Number"),t("zoho_id","Diesel Entry ID"),t("entry_date","Date",{type:"date",required:true}),t("business_transporters","Business Transporters",{required:true}),t("machine","Machine"),t("vehicle","Vehicle"),t("driver","Driver"),t("source","Source",{type:"select",options:["Own bunk","Rent"]}),t("rec_from","From",{type:"radio",options:["Direct","Sales","Rent","Excavator","Excavator Rent","Excavator Daily","Day Fees","Boulders"]}),t("diesel_rate_per_liter","Diesel Rate Per Liter",{type:"number"})]},
    { title: "KM Details", fields: [t("from_km","From KM",{type:"number"}),t("to_km","To KM",{type:"number"}),t("total_km","Total KM",{type:"number",calculated:true}),t("diesel_liters","Diesel Liters",{type:"number",required:true}),t("mileage","Mileage",{type:"number",calculated:true}),t("diesel_amount","Diesel Amount",{type:"number",required:true,calculated:true}),t("bunk_reference","Bunk Reference"),t("tank_status","Tank Status",{type:"radio",options:["Full","Refill"]})]}
  ] },
  { slug: "add-excavators-diesel-entry", title: "Diesel Entry", table: "excavator_diesel_entries", sections: [
    { title: "Basic Details", fields: [
      t("sales_entry_id", "Sales"), t("rent_entry_id", "Rent Entry"), t("day_fees_entry_id", "Day Fees Entry"), t("excavator_id", "Excavators"), t("excavator_rent_entry_id", "Excavators Rent Entries"), t("excavator_daily_entry_id", "Excavators Daily Entries"), t("boulders_entries", "Boulders Entries"), t("dc_number", "DC Number"), t("zoho_id", "Diesel Entry ID"), t("entry_date", "Date", { type: "date", required: true }), t("business_transporters", "Business Transporters", { required: true }), t("machine", "Machine"), t("vehicle", "Vehicle"), t("driver", "Driver"), t("source", "Source", { type: "select", options: ["Own bunk", "Rent"] }), t("rec_from", "From", { type: "radio", options: ["Direct", "Sales", "Rent", "Excavator", "Excavator Rent", "Excavator Daily", "Day Fees", "Boulders"] }), t("diesel_rate_per_liter", "Diesel Rate Per Liter", { type: "number" }),
    ]},
    { title: "KM Details", fields: [ t("from_km", "From KM", { type: "number" }), t("to_km", "To KM", { type: "number" }), t("total_km", "Total KM", { type: "number", calculated: true }), t("diesel_liters", "Diesel Liters", { type: "number", required: true }), t("mileage", "Mileage", { type: "number", calculated: true }), t("diesel_amount", "Diesel Amount", { type: "number", required: true, calculated: true }), t("bunk_reference", "Bunk Reference"), t("tank_status", "Tank Status", { type: "radio", options: ["Full", "Refill"] }) ]},
  ] },
  {
    slug: "add-excavators-rent-entry",
    title: "Excavators Rent Entries",
    table: "excavator_rent_entries",
    sections: [
      { title: "Basic Details", fields: [
        t("entry_date", "Date", { type: "date" }),
        t("business_transporters", "Business Transporters", { required: true }),
        t("machine", "Machine", { required: true }),
        t("dc_number", "DC Number"),
        t("driver", "Driver"),
      ]},
      { title: "Rent Hours/Diesel Details", fields: [
        t("client", "Client"),
        t("start_hour", "Start Hour", { type: "number" }),
        t("end_hour", "End Hour", { type: "number" }),
        t("total_hour", "Total Hour", { type: "number", calculated: true }),
        t("rate_per_hour", "Rate Per Hour", { type: "number" }),
        t("amount", "Amount", { type: "number", calculated: true }),
        t("gst", "GST", { type: "select", options: ["0", "5", "12", "18", "28"] }),
        t("gst_amount", "Gst Amount", { type: "number", calculated: true }),
        t("amount_with_gst", "Amount With GST", { type: "number", calculated: true }),
        t("diesel_source", "Diesel Source", { type: "select", options: ["Own bunk", "Rent"] }),
        t("diesel_filling_l", "Diesel Filling (L)", { type: "number" }),
        t("diesel_rate_per_liter", "Diesel Rate Per Liter", { type: "number" }),
        t("diesel_amount", "Diesel Amount", { type: "number", required: true, calculated: true }),
        t("tank_status", "Tank Status", { type: "select", options: ["Refill", "Empty"] }),
        t("bunk_reference", "Bunk Reference"),
        t("mileage", "Mileage", { type: "number", calculated: true }),
        t("remarks", "Remarks", { full: true }),
      ]},
    ],
  },
  {
    slug: "add-excavators-daily-entry",
    title: "Excavators Daily Entries",
    table: "excavator_daily_entries",
    sections: [{
      title: "",
      fields: [
        t("zoho_id", "Daily Entries ID"),
        t("entry_date", "Date", { type: "date" }),
        t("business_transporters", "Business Transporters", { required: true }),
        t("client", "Client"),
        t("loads_per_day", "Loads /Day", { type: "number", required: true }),
        t("ton_per_day", "Ton / Day", { type: "number", required: true }),
        t("ton_per_rate", "Ton Per Rate", { type: "number", required: true }),
        t("amount", "Amount", { type: "number", required: true }),
        t("gst", "GST", { type: "select", required: true, options: ["0", "5", "12", "18", "28"] }),
        t("gst_amount", "Gst Amount", { type: "number" }),
        t("amount_with_gst", "Amount With GST", { type: "number", required: true }),
        t("diesel_source", "Diesel Source", { type: "select", options: ["Own bunk", "Rent"] }),
        t("bunk_reference", "Bunk Reference"),
        t("diesel_liters", "Diesel Liters", { type: "number", required: true }),
        t("diesel_rate", "Diesel Rate", { type: "number", required: true }),
        t("diesel_amount", "Diesel Amount", { type: "number" }),
        t("profit", "Profit", { type: "number" }),
      ],
    }],
  },
  {
    slug: "add-excavators-entry",
    title: "Excavators",
    table: "excavator_entries",
    sections: [
      {
        title: "Basic Details",
        fields: [
          t("entry_date", "Date", { type: "date" }),
          t("business_transporters", "Business Transporters", { required: true }),
          t("machine", "Machine", { required: true }),
          t("dc_number", "DC Number"),
          t("driver", "Driver"),
        ],
      },
      {
        title: "Hours/Diesel Details",
        fields: [
          t("client", "Client"),
          t("start_hour", "Start Hour", { type: "number" }),
          t("end_hour", "End Hour", { type: "number" }),
          t("starting_diesel_l", "Starting Diesel (L)", { type: "number" }),
          t("filling_diesel_l", "Filling Diesel (L)", { type: "number" }),
          t("ending_diesel_l", "Ending Diesel (L)", { type: "number" }),
          t("diesel_source", "Diesel Source", { type: "select", options: ["Own bunk", "Rent"] }),
          t("diesel_rate_per_liter", "Diesel Rate Per Liter", { type: "number" }),
          t("diesel_amount", "Diesel Amount", { type: "number", required: true, calculated: true }),
          t("tank_status", "Tank Status", { type: "select", options: ["Refill", "Empty"] }),
          t("bunk_reference", "Bunk Reference"),
          t("total_hour", "Total Hour", { type: "number", calculated: true }),
          t("total_diesel_l", "Total DIesel (L)", { type: "number", calculated: true }),
          t("mileage", "Mileage", { type: "number", calculated: true }),
          t("load_count", "Load count", { type: "number", calculated: true }),
          t("diesel_per_load", "Diesel Per Load", { type: "number", calculated: true }),
          t("remarks", "Remarks", { full: true }),
        ],
      },
    ],
  },
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
          t("purchase_total", "Purchase Total", { type: "number", required: true, calculated: true }),
          t("purchase_gst", "Purchase GST %", { type: "select", required: true, options: ["0", "5", "12", "18", "28"] }),
          t("purchase_gst_amount", "Purchase GST Amount", { type: "number", calculated: true }),
          t("purchase_net_total", "Purchase Net Total", { type: "number", calculated: true }),
          t("purchase_paid", "Purchase Paid", { type: "number" }),
          t("purchase_balance", "Purchase Balance", { type: "number", calculated: true }),
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
          t("sales_total", "Sales Total", { type: "number", calculated: true }),
          t("sales_gst", "Sales GST %", { type: "select", required: true, options: ["0", "5", "12", "18", "28"] }),
          t("sales_gst_amount", "Sales GST Amount", { type: "number", calculated: true }),
          t("sales_net_total", "Sales Net Total", { type: "number", calculated: true }),
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
          t("total_vehicle_expense", "Total Vehicle Expense", { type: "number", calculated: true }),
          t("driver_advance", "Driver Advance", { type: "number" }),
          t("choose_account", "Choose Account"),
          t("driver_net_total", "Driver Net Total", { type: "number", calculated: true }),
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
          t("total_km", "Total KM", { type: "number", calculated: true }),
          t("mileage", "Mileage", { type: "number", calculated: true }),
          t("diesel_amount", "Diesel Amount", { type: "number", calculated: true }),
          t("total_trip_expense", "Total Trip Expense", { type: "number", calculated: true }),
        ],
      },
      {
        title: "Profit",
        fields: [t("profit", "Profit", { type: "number", calculated: true })],
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
          t("rent_amount_with_gst", "Rent Amount with GST", { type: "number", calculated: true }),
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
          t("backend", "backend", { type: "number" }),
          t("gst", "GST", { type: "select", options: ["0", "5", "12", "18", "28"] }),
          t("gst_amount", "GST Amount", { type: "number", calculated: true }),
          t("amount_with_gst", "Amount with GST", { type: "number", calculated: true }),
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
          t("total_vehicle_expense", "Total Vehicle Expense", { type: "number", calculated: true }),
          t("driver_advance", "Driver Advance", { type: "number" }),
          t("choose_account", "Choose Account"),
          t("driver_net_total", "Driver Net Total", { type: "number", calculated: true }),
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
          t("total_km", "Total KM", { type: "number", calculated: true }),
          t("mileage", "Mileage", { type: "number", calculated: true }),
          t("diesel_amount", "Diesel Amount", { type: "number" }),
          t("bunk_reference", "Bunk Reference"),
        ],
      },
      {
        title: "Profit",
        fields: [t("profit", "Profit", { type: "number", calculated: true })],
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
          t("amount", "Amount", { type: "number", required: true, calculated: true }),
          t("gst", "GST", { type: "select", options: ["0", "5", "12", "18", "28"] }),
          t("gst_amount", "GST Amount", { type: "number", calculated: true }),
          t("amount_with_gst", "Amount with GST", { type: "number", calculated: true }),
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
          t("total_vehicle_expense", "Total Vehicle Expense", { type: "number", calculated: true }),
          t("driver_advance", "Driver Advance", { type: "number" }),
          t("choose_account", "Choose Account"),
          t("driver_net_total", "Driver Net Total", { type: "number", calculated: true }),
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
          t("total_km", "Total KM", { type: "number", calculated: true }),
          t("diesel_amount", "Diesel Amount", { type: "number", required: true, calculated: true }),
          t("bunk_reference", "Bunk Reference"),
          t("mileage", "Mileage", { type: "number", calculated: true }),
        ],
      },
      {
        title: "Profit",
        fields: [
          t("total_trip_expense", "Total Trip Expense", { type: "number", calculated: true }),
          t("profit", "Profit", { type: "number", calculated: true }),
        ],
      },
      REPORT_FOR_SECTION,
    ],
  },
];

export const ENTRY_FORM_BY_SLUG = new Map(ENTRY_FORMS.map((f) => [f.slug, f]));

/** Map a report slug to its "add" form slug (when one exists). */
export const REPORT_TO_FORM: Record<string, string> = {
  "income-expense":"add-income-expense-entry",
  "def-oil-entries":"add-def-oil-entry",
  "boulders-diesel-entries":"add-boulders-diesel-entry",
  "diesel-entries": "add-diesel-entry",
  "excavators-entries": "add-excavators-entry",
  "excavators-daily-entries": "add-excavators-daily-entry",
  "excavators-rent-entries": "add-excavators-rent-entry",
  "excavators-diesel-entries": "add-excavators-diesel-entry",
  "sales-entries": "add-sales-entry",
  "rent-entries": "add-rent-entry",
  "day-fees-entries": "add-day-fees-entry",
  "all-boulders-entries": "add-boulders-entries",
};
