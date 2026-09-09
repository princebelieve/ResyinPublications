const express = require("express");
const StorePaymentSettings = require("../models/StorePaymentSettings");
const paystack = require("../services/paystack");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

function paystackMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

async function resolveAccount(bankCode, accountNumber) {
  const response = await paystack.get("/bank/resolve", { params: { bank_code: bankCode, account_number: accountNumber } });
  return response.data?.data;
}

router.get("/banks", protect, async (req, res) => {
  try {
    const response = await paystack.get("/bank", { params: { country: "nigeria", perPage: 100 } });
    const banks = (response.data?.data || [])
      .filter((bank) => bank.active !== false && bank.code && bank.name)
      .map((bank) => ({ name: bank.name, code: String(bank.code) }))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json(banks);
  } catch (error) {
    res.status(502).json({ message: paystackMessage(error, "Unable to load Nigerian banks. Check the Paystack configuration.") });
  }
});

router.post("/resolve-account", protect, async (req, res) => {
  const bankCode = String(req.body.bankCode || "").trim();
  const accountNumber = String(req.body.accountNumber || "").replace(/\D/g, "");
  if (!bankCode || accountNumber.length !== 10) return res.status(400).json({ message: "Select a bank and enter a valid 10-digit account number." });
  try {
    const account = await resolveAccount(bankCode, accountNumber);
    if (!account?.account_name) return res.status(400).json({ message: "Paystack could not verify this account." });
    res.json({ accountName: account.account_name, accountNumber, bankCode });
  } catch (error) {
    res.status(400).json({ message: paystackMessage(error, "This account could not be verified.") });
  }
});

async function getSettings() {
  return StorePaymentSettings.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

router.get("/public", async (req, res) => {
  try {
    const settings = await getSettings();
    const enabled = settings.manualTransferEnabled && settings.bankName && settings.accountName && settings.accountNumber;
    res.json({
      manualTransferEnabled: Boolean(enabled),
      bankName: enabled ? settings.bankName : "",
      accountName: enabled ? settings.accountName : "",
      accountNumber: enabled ? settings.accountNumber : "",
      transferInstructions: enabled ? settings.transferInstructions : "",
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to load payment settings." });
  }
});

router.get("/admin", protect, adminOnly, async (req, res) => {
  try { res.json(await getSettings()); }
  catch { res.status(500).json({ message: "Unable to load payment settings." }); }
});

router.put("/admin", protect, adminOnly, async (req, res) => {
  try {
    const settings = {
      manualTransferEnabled: req.body.manualTransferEnabled === true,
      bankName: String(req.body.bankName || "").trim(),
      bankCode: String(req.body.bankCode || "").trim(),
      accountName: String(req.body.accountName || "").trim(),
      accountNumber: String(req.body.accountNumber || "").trim(),
      transferInstructions: String(req.body.transferInstructions || "").trim(),
    };
    if (settings.manualTransferEnabled && (!settings.bankName || !settings.bankCode || !settings.accountNumber)) {
      return res.status(400).json({ message: "Select a bank and enter an account number before enabling manual transfer." });
    }
    if (settings.manualTransferEnabled) {
      const account = await resolveAccount(settings.bankCode, settings.accountNumber.replace(/\D/g, ""));
      settings.accountName = account.account_name;
      settings.accountNumber = String(account.account_number || settings.accountNumber).replace(/\D/g, "");
    }
    res.json(await StorePaymentSettings.findOneAndUpdate({ key: "default" }, { $set: settings, $setOnInsert: { key: "default" } }, { new: true, upsert: true, setDefaultsOnInsert: true }));
  } catch (error) {
    res.status(400).json({ message: paystackMessage(error, "Unable to verify and save payment settings.") });
  }
});

module.exports = router;
