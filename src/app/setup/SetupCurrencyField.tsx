"use client";
import { useState } from "react";
import CurrencyPicker from "@/components/CurrencyPicker";

// Thin wrapper around CurrencyPicker for the Setup form: holds the controlled
// state locally so the picker works inside the server-action <form>, and
// gives the underlying input a name="currency" so it submits like a normal
// form field.
export default function SetupCurrencyField() {
  const [code, setCode] = useState("USD");
  return <CurrencyPicker name="currency" value={code} onChange={setCode} />;
}
