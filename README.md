# CareTrack prototype

A working prototype for a 74-bed virus quarantine and treatment centre. It replaces the nurses' paper journal with a shared daily checklist: who has had their temperature taken, who has been seen by a doctor, and who can go home.

Built with React and Vite. Data is saved in the browser (localStorage), so it demonstrates the workflow; a real release needs a shared database and server-side checks (see "Next steps").

## Run it

    npm install
    npm run dev          # http://localhost:5173
    npm test             # 16 tests for the business rules
    npm run build        # production build in dist/
    npm run build:single # one self-contained file: dist-single/index.html

## Deploy (Vercel)

Option 1, command line:

    npm install -g vercel
    vercel --prod        # accept the defaults; Vercel detects Vite

Option 2, dashboard: push this folder to a GitHub repository, choose "Add New > Project" in Vercel and import it. No settings need changing (build command `npm run build`, output folder `dist`).

Routing uses the URL hash (`#/overview`), so no rewrite rules are needed.

## Try it in two minutes

Pick a role at the top right at any time. The ward starts full (74 of 74 beds) with a mix of patients.

1. **Nurse** > Temperatures. Enter 37.2 for a patient and press Save. They move to "Measured today". Try 45 (rejected), 40.6 (asks you to confirm), and a second reading for the same patient (needs a reason).
2. **Doctor** > Doctor rounds. Patients with a temperature are listed first, feverish ones at the top. "Record visit" works only after a temperature exists. Patients without one show "Record temperature myself", which asks for a reason.
3. **Doctor** > Discharges. Patients with three fever-free days are listed automatically. "Hold discharge" blocks the administrator.
4. **Administrator** > Discharges > Discharge. The bed is freed.
5. **Administrator** > Register patient. Admission is blocked while all beds are full, and works once a bed is free. Anyone waiting can be admitted from the waiting list.
6. **Doctor** > open a patient > Record death. Then **Outcome report** shows success rate against the 85% benchmark, with the sample size and a warning when the sample is too small.
7. **Settings**: the doctor sets the fever threshold (default 38.0 °C); the administrator can require doctor approval before discharge; the activity log lists every action.

Settings > Reset demo data restores the starting state.

## Roles

| Role | Can do | Cannot do |
| --- | --- | --- |
| Nurse | See patients and today's tasks, record temperatures | Record visits, discharge, change settings |
| Doctor | Record visits, record a temperature when the nurse has not, place or release discharge holds, approve discharge (if that mode is on), record deaths, set the fever threshold, view outcomes | Admit or discharge patients |
| Administrator | Admit patients, manage the waiting list, discharge ready patients, view outcomes, set the approval mode | Edit clinical readings, visits or deaths |

## Business rules built in

- Fever: a reading at or above the threshold (default 38.0 °C, set by the doctor).
- Fever-free day: the day has at least one reading and every reading is below the threshold. A missing day does not count. A fever resets the count. Three consecutive such days make the patient eligible. If today has no reading yet, the count ends yesterday.
- One temperature per patient per day. A second reading needs a reason and shows who recorded the first.
- Temperature must be 34.0 to 42.0 °C. Readings of 40.0 °C or higher, or 35.0 °C or lower, need confirmation.
- A doctor visit can be recorded only after today's temperature exists, and only once per day.
- Patients who are eligible for discharge leave the nurse and doctor to-do lists.
- Discharge is blocked unless the rule is met, no hold is in place and (if enabled) the doctor has approved. A new fever clears any approval or hold.
- Admission needs a unique ID and a free bed. When all 74 beds are full, new arrivals go on a waiting list.
- Deaths are recorded by doctors only. Success rate = recovered divided by all final outcomes. The report shows the sample size and warns when fewer than 20 outcomes are in the period.
- Every sensitive action is written to the activity log with user, time and detail.

The rules live in `src/logic.js` and `src/actions.js` and are covered by `tests/rules.test.mjs`.

## Project layout

    src/logic.js      pure rules: dates, fever-free count, discharge state, outcome stats
    src/actions.js    every user action with its permission and validation checks
    src/seed.js       demo data (74 patients, earlier outcomes, waiting list)
    src/screens/      Overview, Temperatures, Rounds, Discharges, Register, Outcomes, Settings, PatientDetail
    src/components/   shared UI (modal, chart) and the action dialogs
    tests/            business rule tests

## Next steps for a production release

Shared database and live sync between staff devices, real sign-in with server-side role checks, a permanent audit log, offline-tolerant temperature entry for patchy wifi, shift handover notes, and SMS or push reminders for pending readings.
