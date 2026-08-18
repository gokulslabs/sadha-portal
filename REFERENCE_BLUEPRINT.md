# Reference Site Blueprint — Sadha Groups Portal

Source: https://sadhagroups.zohocreatorportal.com/ (Zoho Creator)

## Theme
- Font: **Lato, sans-serif** (base 14.5px)
- Body: white background, text `rgb(18,19,43)`
- Sidebar: dark `rgb(22,22,42)`
- Reports render as **Handsontable grids** (spreadsheet-style list views)

## Navigation (36 routes, organized into sections)
- **Dashboard**: Dashboard (`#Page:Dashboard`), All Reports (`#Page:Search_Statement`)
- **Diesel**: Diesel Entries, Def Oil Entries
- **Sales**: Add Sales Entry (form), Sales Entries, Add Rent Entry (form), Rent Entries, Add Day Fees Entry (form), Day Fees Entries
- **Boulders**: Boulder Reports, Add Boulders Entries (form), All Boulders Entries, Boulders Diesel Entries
- **Excavators**: Excavator Reports, Machines, Excavators Entries, Excavators Daily Entries, Excavators Rent Entries, Excavators Diesel Entries
- **Accounts**: Accounts, Income & Expense
- **Entries**: Materials, Vendors, Clients, Drivers, Vehicles, Material Rates, Units, Categories, Sub Categories, Payment Categories
- **Profile**: Company Profile, Transporters

## Forms (4, with full field lists)

### 1. Add Sales Entry (`#Form:Add_Sales_Entry`)
Sections: Basic Details → Purchase Details → Sales Details → Transport → Vehicle Expense → Trip Expense → Diesel Entry → Report For.

Core fields: Sales ID, Date, Business Transporters, DC Number, Contact Number, Purchase From, Materials, Purchase Unit, Purchase Quantity, Purchase Rate, Purchase Round Off, Purchase Total, Purchase GST %, Purchase GST Amount, Purchase Total with GST, Purchase Net Total, Purchase Paid, Purchase Balance, Client Name, Delivery Location, Sales Unit, Sales Quantity, Sales Rate, Sales Amount, ... Vehicle, Driver, Driver Padi, Driver Food Amount, Shed Work Amount, Total Vehicle Expense, Driver Advance, Driver Net Total, Diesel Source, Diesel Liters, Diesel Amount, Total Trip Expense, Profit + Report For filters (BT Type, Report From/To/For, Client/Vendor/Vehicle/Driver Report Filters).

### 2. Add Rent Entry (`#Form:Rent_Entry`)
Sections: Basic Details → Rent Details → Transport Details → Vehicle Expense Details → Trip Expense Details → Diesel Entry Details → Report For.

Fields: Rent Entry ID, Date, Business Transporters, Purchase From, Quantity, DC Number, Contact Number, Material, Unit, Client Name, Delivery Location, Rent Quantity, Rent Price (Per Unit/Ton), Rent Amount, GST, Rent GST Amount, Rent Amount with GST, Vehicle Number, Driver Name, Driver Padi, Driver Food Amount, Shed Work Amount, Total Vehicle Expense, Driver Advance, Choose Account, Driver Net Total, Diesel Source, Diesel Rate Per Liter, From KM, To KM, Diesel Liters, Tank Status, Total KM, Mileage, Diesel Amount, Bunk Reference, Total Trip Expense, Profit + Report For filters.

### 3. Add Day Fees Entry (`#Form:Day_Fees_Entry`)
Sections: Basic Details → Day Fees Details → Transport Details → Vehicle Expense Details → Trip Expense Details → Diesel Entry Details → Report For.

Fields: Day Fees Entry ID, Date, Business Transporters, Purchase From, Quantity, DC Number, Contact Number, Material, Unit, Client Name, Delivery Location, Total load, Per Day amount, GST, GST Amount, Amount with GST, Vehicle Number, Driver Name, Driver Padi, Driver Food Amount, Shed Work Amount, Total Vehicle Expense, Driver Advance, Choose Account, Driver Net Total + Diesel Entry fields (same as Rent) + Report For filters.

### 4. Add Boulders Entries (`#Form:Boulders_Entries`)
Sections: Basic Details → Boulders Rent Details → Transport Details → Vehicle Expense Details → Trip Expense Details → Diesel Entry Details → Report For.

Fields: Boulder Entry ID, Date, Boulder Shift (radio), DC Number, Business Transporters, Client Name, Delivery Location, Unit, Boulders Source, Total Loads, Total Tons, Ton Per Rate, Amount, GST, GST Amount, Amount with GST, Vehicle Number, Driver Name, Driver Padi, Driver Food Amount, Shed Work Amount, Total Vehicle Expense, Driver Advance, Choose Account, Driver Net Total + Diesel Entry fields + Report For.

## Reports (24) + columns — see `data/zoho_export/portal_data.json`
Each report is a spreadsheet-style grid. Columns are fully captured in the `_meta.reportList[].columns` of that file (e.g. Sales Entry has 24 columns, Rent Entry 37, Boulders 27, Diesel 17, etc.).

## Master data
- Clients (51), Vendors (35), Drivers (74), Vehicles (48), Materials (28), Machines (7), Transporters (14)
- Total: 4,528 records, 24 reports extracted 2026-08-18.

## UI/UX notes
- Sidebar = two-pane (rail + sub-tabs), dark theme.
- Reports = Handsontable grid with search + sort + export + print from header.
- Forms = sectioned (section header + grid of labelled fields).
- Dashboard = financial cards + charts (transporter-wise pie, financial bar, today sales/rent/diesel/excavator performance) + quick actions.

## Artifacts (gitignored /tmp + repo)
- Screenshots: `/tmp/zoho_ux/*.png` (34 pages)
- Form fields + theme JSON: `/tmp/zoho_ux/_ui_audit_report.json`, `_theme.json`
- Full schema + records: `data/zoho_export/portal_data.json` (4 MB)