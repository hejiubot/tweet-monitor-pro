// SkillPay Billing SDK — Node.js (Official API)
// 1 USDT = 1000 tokens | 1 call = 1 token | Min deposit 8 USDT

const axios = require('axios');

const BILLING_URL = 'https://skillpay.me/api/v1/billing';
const API_KEY = process.env.SKILLPAY_API_KEY || process.env.SKILL_BILLING_API_KEY;
const SKILL_ID = process.env.SKILLPAY_SKILL_ID || process.env.SKILL_ID;

const headers = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json'
};

class SkillPayClient {
  // 扣费：每次调用消耗 1 token
  // 返回：{ ok: true, balance: 999 } 或 { ok: false, balance: 0, payment_url: '...' }
  async chargeUser(userId) {
    try {
      const { data } = await axios.post(`${BILLING_URL}/charge`, {
        user_id: userId,
        skill_id: SKILL_ID,
        amount: 0  // amount=0 表示消耗 1 token
      }, { headers });
      
      return {
        ok: data.success,
        balance: data.balance,
        payment_url: data.payment_url
      };
    } catch (error) {
      console.error('SkillPay charge failed:', error.response?.data || error.message);
      return { ok: false, error: error.message };
    }
  }

  // 查询用户余额（tokens）
  async getBalance(userId) {
    try {
      const { data } = await axios.get(`${BILLING_URL}/balance`, {
        params: { user_id: userId },
        headers
      });
      return data.balance;
    } catch (error) {
      console.error('SkillPay getBalance failed:', error.response?.data || error.message);
      return null;
    }
  }

  // 获取充值链接（当余额不足时）
  async getPaymentLink(userId, amount = 8) {
    try {
      const { data } = await axios.post(`${BILLING_URL}/payment-link`, {
        user_id: userId,
        amount  // 充值 amount USDT (收到 amount*1000 tokens)
      }, { headers });
      return data.payment_url;
    } catch (error) {
      console.error('SkillPay getPaymentLink failed:', error.response?.data || error.message);
      return null;
    }
  }

  // 便捷方法：检查并扣费（返回是否成功 + 余额）
  async checkAndCharge(userId) {
    const result = await this.chargeUser(userId);
    if (result.ok) {
      return { success: true, balance: result.balance };
    } else {
      // 余额不足，生成充值链接
      const paymentUrl = await this.getPaymentLink(userId, 8);
      return {
        success: false,
        error: 'insufficient_balance',
        balance: result.balance,
        payment_url: paymentUrl
      };
    }
  }
}

// 初始化
let skillpayClient = null;

if (API_KEY && SKILL_ID) {
  skillpayClient = new SkillPayClient();
  console.log('[SkillPay] Client initialized');
  console.log('[SkillPay] Endpoint:', BILLING_URL);
  console.log('[SkillPay] SKILL_ID:', SKILL_ID);
} else {
  console.warn('[SkillPay] API_KEY or SKILL_ID not set. Integration disabled.');
}

module.exports = { SkillPayClient, skillpayClient };
