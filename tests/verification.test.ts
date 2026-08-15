import { describe, expect, it } from "vitest";
import { getAddress } from "viem";
import { evaluatePayment, transferLog } from "@/lib/verify-rules";
import { parseVerseAmount } from "@/lib/amounts";

const TOKEN = getAddress("0xc708d6f2153933daa50b2d0758955be0a93a8fec");
const OTHER = getAddress("0x249ca82617ec3dfb2589c4c17ab7ec9765350a18");
const MERCHANT = getAddress("0x83a1b9c141f2aaaaaaaaaaaaaaaaaaaaaaaaaaaa");
const OTHER_WALLET = getAddress("0x72aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
const CUSTOMER = getAddress("0x11aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

const expected = parseVerseAmount("500", 18);

function base(over: Partial<Parameters<typeof evaluatePayment>[0]> = {}) {
  return evaluatePayment({
    configuredChainId: 137,
    invoiceChainId: 137,
    trustedToken: TOKEN,
    invoiceToken: TOKEN,
    merchantWallet: MERCHANT,
    expectedAmount: expected,
    requiredConfirmations: 3,
    currentBlock: 100n,
    transaction: { chainId: 137 },
    receipt: {
      status: "success",
      blockNumber: 98n,
      logs: [
        transferLog({
          token: TOKEN,
          from: CUSTOMER,
          to: MERCHANT,
          amount: expected,
        }),
      ],
    },
    ...over,
  });
}

describe("payment verification rules", () => {
  it("accepts an exact VERSE transfer to the merchant after confirmations", () => {
    const result = base();
    expect(result.kind).toBe("accepted");
    if (result.kind === "accepted") {
      expect(result.relation).toBe("exact");
      expect(result.amount).toBe(expected);
      expect(result.to).toBe(MERCHANT);
    }
  });

  it("rejects the wrong chain", () => {
    const result = base({ invoiceChainId: 1, transaction: { chainId: 1 } });
    expect(result).toMatchObject({ kind: "invalid", code: "WRONG_CHAIN" });
  });

  it("rejects a different token contract even if named VERSE", () => {
    const result = base({
      receipt: {
        status: "success",
        blockNumber: 98n,
        logs: [transferLog({ token: OTHER, from: CUSTOMER, to: MERCHANT, amount: expected })],
      },
    });
    expect(result).toMatchObject({ kind: "invalid", code: "WRONG_TOKEN" });
  });

  it("rejects the wrong recipient", () => {
    const result = base({
      receipt: {
        status: "success",
        blockNumber: 98n,
        logs: [transferLog({ token: TOKEN, from: CUSTOMER, to: OTHER_WALLET, amount: expected })],
      },
    });
    expect(result).toMatchObject({ kind: "invalid", code: "WRONG_RECIPIENT" });
  });

  it("flags under and over payment without accepting as exact", () => {
    const under = base({
      receipt: {
        status: "success",
        blockNumber: 98n,
        logs: [
          transferLog({
            token: TOKEN,
            from: CUSTOMER,
            to: MERCHANT,
            amount: parseVerseAmount("300", 18),
          }),
        ],
      },
    });
    expect(under.kind === "accepted" && under.relation === "under").toBe(true);

    const over = base({
      receipt: {
        status: "success",
        blockNumber: 98n,
        logs: [
          transferLog({
            token: TOKEN,
            from: CUSTOMER,
            to: MERCHANT,
            amount: parseVerseAmount("600", 18),
          }),
        ],
      },
    });
    expect(over.kind === "accepted" && over.relation === "over").toBe(true);
  });

  it("rejects a reverted transaction", () => {
    const result = base({
      receipt: { status: "reverted", blockNumber: 98n, logs: [] },
    });
    expect(result).toMatchObject({ kind: "invalid", code: "TX_REVERTED" });
  });

  it("rejects a missing transaction", () => {
    const result = base({ transaction: null, receipt: null });
    expect(result).toMatchObject({ kind: "invalid", code: "TX_NOT_FOUND" });
  });

  it("waits for confirmations", () => {
    const result = base({ currentBlock: 98n, requiredConfirmations: 30 });
    expect(result.kind).toBe("pending");
  });
});
