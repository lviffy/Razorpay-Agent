import type {
  SpendingMandate,
  X402PaymentRequirements,
  X402PaymentAuthorization,
  X402PaymentResponse,
  PaymentExecutionResult,
} from "@zapai/types";
import { verifyPaymentAuthorization } from "./verifier";
import { executeSettlement, SettleChallengeOptions } from "./settlement";
import { encodePaymentResponse } from "./headers";

export interface FacilitatorVerifyRequest {
  authorization: X402PaymentAuthorization;
  requirements: X402PaymentRequirements;
  mandate: SpendingMandate;
  merchantId: string;
  skuId?: string;
  secret?: string;
}

export interface FacilitatorVerifyResponse {
  valid: boolean;
  paymentId?: string;
  error?: string;
}

export interface FacilitatorSettleRequest extends FacilitatorVerifyRequest {
  orderId: string;
  options?: SettleChallengeOptions;
}

export interface FacilitatorSettleResponse {
  success: boolean;
  response: X402PaymentResponse;
  encodedHeader: string;
  executionResult: PaymentExecutionResult;
  error?: string;
}

/**
 * ZapAI Facilitator: Central protocol coordinator for x402 V2 verification & settlement.
 */
export class ZapAIFacilitator {
  /**
   * Endpoint handler for /x402/verify
   */
  public verify(params: FacilitatorVerifyRequest): FacilitatorVerifyResponse {
    const check = verifyPaymentAuthorization({
      authorization: params.authorization,
      requirements: params.requirements,
      mandate: params.mandate,
      merchantId: params.merchantId,
      skuId: params.skuId,
      secret: params.secret,
      consumeNonce: false, // only verify, do not consume nonce yet
    });

    if (!check.valid) {
      return {
        valid: false,
        error: check.error,
      };
    }

    return {
      valid: true,
      paymentId: params.authorization.paymentId,
    };
  }

  /**
   * Endpoint handler for /x402/settle
   */
  public async settle(params: FacilitatorSettleRequest): Promise<FacilitatorSettleResponse> {
    // 1. Full Zero-Trust Verification (and consume nonce upon settling)
    const check = verifyPaymentAuthorization({
      authorization: params.authorization,
      requirements: params.requirements,
      mandate: params.mandate,
      merchantId: params.merchantId,
      skuId: params.skuId,
      secret: params.secret,
      consumeNonce: true,
    });

    if (!check.valid) {
      const errorResp: X402PaymentResponse = {
        success: false,
        error: check.error,
      };
      return {
        success: false,
        response: errorResp,
        encodedHeader: encodePaymentResponse(errorResp),
        executionResult: {
          success: false,
          settlementMode: "AUTONOMOUS_FACILITATOR",
          status: "FAILED",
          error: check.error,
        },
        error: check.error,
      };
    }

    // 2. Route through Settlement Coordinator to Payment Rails
    const execResult = await executeSettlement({
      authorization: params.authorization,
      requirements: params.requirements,
      merchantId: params.merchantId,
      orderId: params.orderId,
      options: params.options,
    });

    if (!execResult.success) {
      const errorResp: X402PaymentResponse = {
        success: false,
        error: execResult.error,
      };
      return {
        success: false,
        response: errorResp,
        encodedHeader: encodePaymentResponse(errorResp),
        executionResult: execResult,
        error: execResult.error,
      };
    }

    // 3. Build Payment Response payload
    const paymentResponse: X402PaymentResponse = {
      success: true,
      transactionId: params.authorization.paymentId,
      paymentId: execResult.razorpayPaymentId || params.authorization.paymentId,
      orderId: params.orderId,
      amount: parseInt(params.authorization.amount, 10),
      settledAt: new Date().toISOString(),
    };

    return {
      success: true,
      response: paymentResponse,
      encodedHeader: encodePaymentResponse(paymentResponse),
      executionResult: execResult,
    };
  }
}

export const defaultFacilitator = new ZapAIFacilitator();
