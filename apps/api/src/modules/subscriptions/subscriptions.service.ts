import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SubscriptionTier,
  PaymentStatus,
  PaymentMethod,
  Role,
} from '@prisma/client';
import * as crypto from 'crypto';
import { RabbitMQService, QUEUES } from '../../common/rabbitmq/rabbitmq.service';

@Injectable()
export class SubscriptionsService implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private rabbitMQ: RabbitMQService,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultPlans();

    // Consumer Worker: Payment Webhook Queue (vocabflow.payment.webhook)
    await this.rabbitMQ.consume(
      QUEUES.PAYMENT_WEBHOOK,
      async (data: { orderId: string; transactionCode: string; payload: any }, ack, nack) => {
        try {
          this.logger.log(`[RabbitMQ Worker] Processing payment fulfillment for order ${data.orderId}...`);
          const order = await this.prisma.paymentOrder.findUnique({
            where: { id: data.orderId },
            include: { plan: true },
          });
          if (!order) {
            this.logger.warn(`Order ${data.orderId} not found in database for fulfillment.`);
            ack();
            return;
          }
          await this.activateOrderAndSubscription(order, data.transactionCode, data.payload);
          ack();
        } catch (err: any) {
          this.logger.error(`Error processing payment webhook queue: ${err.message}`);
          nack(false); // Route to Dead Letter Queue
        }
      },
      { prefetch: 5, maxRetries: 3 },
    );
  }

  /**
   * Đảm bảo các gói cước mặc định luôn tồn tại trong cơ sở dữ liệu
   */
  async ensureDefaultPlans() {
    try {
      const defaultPlans = [
        {
          tier: SubscriptionTier.FREE,
          name: 'Learner Free',
          slug: 'free',
          description: 'Nền tảng học từ vựng TOEIC vững chắc, thuật toán lặp lại ngắt quãng SRS và phát âm bản xứ.',
          priceMonthly: 0,
          priceYearly: 0,
          currency: 'VND',
          billingCycle: 'MONTHLY',
          status: 'ACTIVE',
          displayOrder: 1,
          aiDailyQuota: 10,
          maxCustomDecks: 3,
          unlimitedReviews: false,
          features: [
            '600+ Từ Vựng TOEIC Tiêu Chuẩn',
            'Thuật toán Spaced Repetition (SRS)',
            'Phát âm giọng bản ngữ US/UK',
            '10 Lượt Tham Vấn AI Tutor / Ngày (Reset 00:00)',
            '3 Lượt Trích Xuất Text-to-Vocab / Ngày',
            'Duyệt bộ thẻ học cộng đồng công khai',
          ],
          limits: {
            aiChat: 10,
            voiceAiMinutes: 5,
            pronunciation: 5,
            textToVocab: 3,
            storyGen: 1,
          },
          permissions: {
            aiChat: true,
            voiceAi: false,
            personalMemory: false,
            pronunciationCoach: true,
            speakingAnalysis: false,
            roleplay: false,
            personalizedLearning: false,
            spacedRepetition: true,
            advancedAnalytics: false,
            englishTwin: false,
          },
        },
        {
          tier: SubscriptionTier.PLUS,
          name: 'VocabFlow Plus',
          slug: 'plus',
          description: 'Tăng tốc tiếp thu với bộ đề kiểm tra linh hoạt, hạn mức AI rộng rãi và bảo lưu chuỗi Streak.',
          priceMonthly: 99000,
          priceYearly: 828000,
          currency: 'VND',
          billingCycle: 'MONTHLY',
          status: 'ACTIVE',
          displayOrder: 2,
          aiDailyQuota: 50,
          maxCustomDecks: 20,
          unlimitedReviews: true,
          features: [
            'Tất cả tính năng trong gói Free',
            '50 Lượt Tham Vấn AI Tutor / Ngày (Reset 00:00)',
            '15 Lượt Trích Xuất Text-to-Vocab / Ngày',
            '5 Lượt Dệt Câu Chuyện AI Story / Ngày',
            '🚑 Memory Rescue cảnh báo từ vựng sắp quên',
            'Bảo lưu chuỗi Streak 3 ngày/tháng',
            'Gia hạn theo chu kỳ (Tháng hoặc Năm)',
          ],
          limits: {
            aiChat: 50,
            voiceAiMinutes: 30,
            pronunciation: 25,
            textToVocab: 15,
            storyGen: 5,
          },
          permissions: {
            aiChat: true,
            voiceAi: true,
            personalMemory: true,
            pronunciationCoach: true,
            speakingAnalysis: true,
            roleplay: true,
            personalizedLearning: true,
            spacedRepetition: true,
            advancedAnalytics: false,
            englishTwin: false,
          },
        },
        {
          tier: SubscriptionTier.PRO,
          name: 'VocabFlow Pro',
          slug: 'pro',
          description: 'Tối đa tiềm năng với AI Tutor phân tích chuyên sâu, 200 lượt AI/ngày, chẩn đoán CEFR và English Twin.',
          priceMonthly: 199000,
          priceYearly: 1548000,
          currency: 'VND',
          billingCycle: 'MONTHLY',
          status: 'ACTIVE',
          displayOrder: 3,
          aiDailyQuota: 200,
          maxCustomDecks: 999,
          unlimitedReviews: true,
          features: [
            'Tất cả tính năng trong gói Plus',
            '200 Lượt Tham Vấn AI Chuyên Sâu / Ngày (Reset 00:00)',
            '50 Lượt Trích Xuất Text-to-Vocab / Ngày',
            '20 Lượt Dệt Câu Chuyện AI Story / Ngày',
            'Phân tích chuẩn đoán CEFR & AI Coach cá nhân hóa',
            'Ưu tiên băng thông máy chủ mô hình AI tốc độ cao',
            'Không giới hạn phục hồi chuỗi Streak',
            'Hỗ trợ chuyên gia học tập 24/7',
          ],
          limits: {
            aiChat: 200,
            voiceAiMinutes: 60,
            pronunciation: 50,
            textToVocab: 50,
            storyGen: 20,
          },
          permissions: {
            aiChat: true,
            voiceAi: true,
            personalMemory: true,
            pronunciationCoach: true,
            speakingAnalysis: true,
            roleplay: true,
            personalizedLearning: true,
            spacedRepetition: true,
            advancedAnalytics: true,
            englishTwin: true,
          },
        },
      ];

      for (const p of defaultPlans) {
        await this.prisma.plan.upsert({
          where: { tier: p.tier },
          update: {
            name: p.name,
            slug: p.slug,
            description: p.description,
            priceMonthly: p.priceMonthly,
            priceYearly: p.priceYearly,
            status: p.status,
            displayOrder: p.displayOrder,
            aiDailyQuota: p.aiDailyQuota,
            maxCustomDecks: p.maxCustomDecks,
            unlimitedReviews: p.unlimitedReviews,
            features: p.features,
            limits: p.limits,
            permissions: p.permissions,
          },
          create: {
            tier: p.tier,
            name: p.name,
            slug: p.slug,
            description: p.description,
            priceMonthly: p.priceMonthly,
            priceYearly: p.priceYearly,
            currency: p.currency,
            billingCycle: p.billingCycle,
            status: p.status,
            displayOrder: p.displayOrder,
            aiDailyQuota: p.aiDailyQuota,
            maxCustomDecks: p.maxCustomDecks,
            unlimitedReviews: p.unlimitedReviews,
            features: p.features,
            limits: p.limits,
            permissions: p.permissions,
          },
        });
      }
      this.logger.log('Default subscription plans verified with dynamic limits and permissions.');
    } catch (err) {
      this.logger.warn(`Could not seed default plans: ${err.message}`);
    }
  }

  async getPlans() {
    await this.ensureDefaultPlans();
    return this.prisma.plan.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getUserEntitlements(userId: string) {
    const today = new Date().toISOString().slice(0, 10);

    const [user, subscription, usage, plans] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      }),
      this.prisma.subscription.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.entitlementUsage.findUnique({
        where: { userId_date: { userId, date: today } },
      }),
      this.prisma.plan.findMany(),
    ]);

    const isRolePro =
      user?.role === Role.PREMIUM_USER ||
      user?.role === Role.ADMIN ||
      user?.role === Role.SUPER_ADMIN;

    const proPlan = plans.find((p) => p.tier === SubscriptionTier.PRO) || {
      tier: SubscriptionTier.PRO,
      name: 'VocabFlow Pro',
      priceMonthly: 199000,
      aiDailyQuota: 200,
      maxCustomDecks: 999,
      unlimitedReviews: true,
      features: ['200 AI Daily', 'VIP Features'],
    };

    const defaultPlan = plans.find((p) => p.tier === SubscriptionTier.FREE) || {
      tier: SubscriptionTier.FREE,
      name: 'Free Starter',
      priceMonthly: 0,
      aiDailyQuota: 10,
      maxCustomDecks: 3,
      unlimitedReviews: false,
    };

    const currentPlan = isRolePro
      ? (proPlan || subscription?.plan || defaultPlan)
      : (subscription?.plan || defaultPlan);
    const isPro = isRolePro || currentPlan.tier === SubscriptionTier.PRO;
    const isPlus = !isPro && currentPlan.tier === SubscriptionTier.PLUS;
    const aiUsed = usage?.aiUsageCount || 0;
    const aiQuota = isPro
      ? (currentPlan.aiDailyQuota > 0 ? currentPlan.aiDailyQuota : 200)
      : currentPlan.aiDailyQuota;
    const aiRemaining = Math.max(0, aiQuota - aiUsed);

    const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;
    const currentPeriodEnd = subscription?.currentPeriodEnd
      ? subscription.currentPeriodEnd
      : isAdmin
      ? new Date('2099-12-31T23:59:59.000Z')
      : isPro || isPlus
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : null;

    return {
      tier: isPro ? SubscriptionTier.PRO : currentPlan.tier,
      dailyAiQuota: aiQuota,
      dailyAiUsed: aiUsed,
      dailyAiRemaining: aiRemaining,
      features: {
        canCreateCustomDecks: isPro || currentPlan.maxCustomDecks > 3,
        hasAdvancedAnalytics: isPro || currentPlan.tier !== SubscriptionTier.FREE,
        unlimitedAiTutor: false, // Giới hạn theo ngày để bảo vệ tài nguyên AI
      },
      currentPlan: {
        tier: isPro ? SubscriptionTier.PRO : currentPlan.tier,
        name: isPro ? 'VocabFlow Pro' : currentPlan.name,
        priceMonthly: currentPlan.priceMonthly,
        isPro,
        isPlus,
        isFree: !isPro && !isPlus,
        currentPeriodEnd,
      },
      usageToday: {
        date: today,
        aiUsed,
        aiQuota,
        aiRemaining,
        canUseAI: aiRemaining > 0,
      },
    };
  }

  /**
   * Tạo đơn hàng thanh toán (VietQR hoặc PayOS Gateway)
   * Hỗ trợ chu kỳ thanh toán: monthly (hàng tháng) hoặc yearly (theo năm - tiết kiệm ~35%)
   */
  async createPaymentOrder(
    userId: string,
    tier: SubscriptionTier,
    method: PaymentMethod = PaymentMethod.VIETQR,
    billingCycle: 'monthly' | 'yearly' = 'monthly',
  ) {
    const gatewayStatus = await this.getPaymentGatewayStatus();
    if (!gatewayStatus.enabled) {
      throw new BadRequestException(
        gatewayStatus.reason ||
          'Cổng thanh toán đang tạm đóng để hoàn tất thủ tục đăng ký / thông báo với Bộ Công Thương. Vui lòng quay lại sau!',
      );
    }

    const plan = await this.prisma.plan.findUnique({ where: { tier } });
    if (!plan) throw new NotFoundException('Gói cước không tồn tại');
    if (plan.priceMonthly <= 0) {
      throw new BadRequestException('Gói cước này là miễn phí, không cần thanh toán');
    }

    // Sinh mã đơn hàng ngẫu nhiên 6 chữ số độc nhất (Thử tối đa 10 lần tránh race condition)
    let orderCode = 0;
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = Math.floor(100000 + Math.random() * 900000);
      const existing = await this.prisma.paymentOrder.findUnique({
        where: { orderCode: candidate },
      });
      if (!existing) {
        orderCode = candidate;
        break;
      }
    }
    if (!orderCode) {
      throw new BadRequestException('Hệ thống đang quá tải tạo mã đơn hàng. Vui lòng thử lại sau giây lát!');
    }

    const description = `VF${orderCode}`;

    // Tính toán số tiền dựa trên chu kỳ thanh toán
    let amount = plan.priceMonthly;
    if (billingCycle === 'yearly') {
      amount = plan.priceYearly > 0 ? plan.priceYearly : Math.round(plan.priceMonthly * 10);
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút đếm ngược

    // Thông tin tài khoản ngân hàng nhận VietQR
    const bankId = process.env.VIETQR_BANK_ID || 'MB';
    const accountNo = process.env.VIETQR_ACCOUNT_NO || '0388888888';
    const accountName = process.env.VIETQR_ACCOUNT_NAME || 'VOCABFLOW VOCABFLOW';
    const template = process.env.VIETQR_TEMPLATE || 'compact2';

    // Tạo link ảnh mã VietQR chuẩn NAPAS EMVCo từ VietQR Quick Link Service
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(
      description,
    )}&accountName=${encodeURIComponent(accountName)}`;

    let checkoutUrl: string | null = null;

    // Kiểm tra cấu hình PayOS (nếu người dùng truyền key vào .env)
    const payosClientId = process.env.PAYOS_CLIENT_ID;
    const payosApiKey = process.env.PAYOS_API_KEY;
    const payosChecksumKey = process.env.PAYOS_CHECKSUM_KEY;

    if (method === PaymentMethod.PAYOS && payosClientId && payosApiKey && payosChecksumKey) {
      try {
        const returnUrl = `${process.env.APP_URL || 'http://localhost:3000'}/upgrade?payment=success&orderCode=${orderCode}`;
        const cancelUrl = `${process.env.APP_URL || 'http://localhost:3000'}/upgrade?payment=cancelled`;

        // Tạo chữ ký HMAC SHA256 cho PayOS request
        const dataStr = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
        const signature = crypto
          .createHmac('sha256', payosChecksumKey)
          .update(dataStr)
          .digest('hex');

        const payosRes = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': payosClientId,
            'x-api-key': payosApiKey,
          },
          body: JSON.stringify({
            orderCode,
            amount,
            description,
            returnUrl,
            cancelUrl,
            signature,
          }),
        });

        const payosJson: any = await payosRes.json();
        if (payosJson.code === '00' && payosJson.data?.checkoutUrl) {
          checkoutUrl = payosJson.data.checkoutUrl;
        }
      } catch (payosErr) {
        this.logger.warn(`PayOS API request failed, falling back to VietQR: ${payosErr.message}`);
      }
    }

    // Lưu PaymentOrder vào CSDL
    const order = await this.prisma.paymentOrder.create({
      data: {
        orderCode,
        userId,
        planId: plan.id,
        tier: plan.tier,
        amount,
        status: PaymentStatus.PENDING,
        paymentMethod: method,
        description,
        qrUrl,
        checkoutUrl,
        expiresAt,
      },
    });

    const orderDetails = {
      id: order.id,
      orderCode: order.orderCode,
      tier: order.tier,
      planName: plan.name,
      amount: order.amount,
      paymentMethod: order.paymentMethod,
      description: order.description,
      transferContent: `VF ${order.orderCode}`,
      bankId,
      bankName: this.getBankDisplayName(bankId),
      accountNo,
      accountName,
      qrUrl,
      checkoutUrl: order.checkoutUrl,
      expiresAt: order.expiresAt,
      isPayOSConfigured: Boolean(payosClientId && payosApiKey && payosChecksumKey),
    };

    return {
      success: true,
      ...orderDetails,
      order: orderDetails,
    };
  }

  /**
   * Tra cứu trạng thái đơn hàng (Dành cho Polling phía Frontend)
   */
  async getPaymentStatus(orderCode: number) {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { orderCode },
      include: { plan: true },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    // Kiểm tra hết hạn
    if (order.status === PaymentStatus.PENDING && new Date() > order.expiresAt) {
      await this.prisma.paymentOrder.update({
        where: { id: order.id },
        data: { status: PaymentStatus.EXPIRED },
      });
      return {
        success: true,
        status: PaymentStatus.EXPIRED,
        orderCode: order.orderCode,
        tier: order.tier,
      };
    }

    return {
      success: true,
      status: order.status,
      orderCode: order.orderCode,
      tier: order.tier,
      amount: order.amount,
      planName: order.plan.name,
      paidAt: order.paidAt,
    };
  }

  /**
   * Webhook xử lý thanh toán chuyển khoản VietQR (Hỗ trợ SePay, Casso, VietQR Bank Sync)
   */
  async handleVietQRWebhook(payload: any, authHeader?: string) {
    this.logger.log(`VietQR Webhook received: ${JSON.stringify(payload)}`);

    // Kiểm tra bảo mật nếu có cấu hình PAYMENT_WEBHOOK_SECRET
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (secret) {
      if (!authHeader) {
        this.logger.warn('VietQR Webhook rejected: missing Authorization header while PAYMENT_WEBHOOK_SECRET is active');
        throw new UnauthorizedException('Chữ ký Webhook bắt buộc nhưng không được cung cấp');
      }
      const cleanHeader = authHeader.replace(/^(Bearer|Apikey)\s+/i, '');
      if (cleanHeader !== secret && authHeader !== secret) {
        this.logger.warn('VietQR Webhook authentication mismatch');
        throw new UnauthorizedException('Chữ ký Webhook không hợp lệ');
      }
    }

    // Bóc tách nội dung chuyển khoản và số tiền từ nhiều format webhook phổ biến
    let content = '';
    let amount = 0;
    let transactionCode = '';

    if (payload.transactionContent || payload.content) {
      content = payload.transactionContent || payload.content || '';
      amount = Number(payload.amountIn || payload.amount || 0);
      transactionCode = payload.referenceNumber || payload.code || payload.id || '';
    } else if (Array.isArray(payload.data) && payload.data.length > 0) {
      const item = payload.data[0];
      content = item.description || '';
      amount = Number(item.amount || 0);
      transactionCode = String(item.tid || item.id || '');
    } else if (payload.description) {
      content = payload.description;
      amount = Number(payload.amount || 0);
      transactionCode = String(payload.code || payload.id || '');
    }

    // Tìm kiếm cú pháp VF<Mã_Đơn_Hàng> (Ví dụ VF829103 hoặc VF 829103)
    const match = content.match(/VF\s*([0-9]{5,8})/i);
    if (!match) {
      this.logger.warn(`Webhook content does not match VF pattern: "${content}"`);
      return {
        success: false,
        message: 'Nội dung chuyển khoản không khớp mã đơn hàng VF',
      };
    }

    const orderCode = parseInt(match[1], 10);
    const order = await this.prisma.paymentOrder.findUnique({
      where: { orderCode },
      include: { plan: true },
    });

    if (!order) {
      this.logger.warn(`Order code ${orderCode} not found in database`);
      return { success: false, message: `Không tìm thấy đơn hàng ${orderCode}` };
    }

    if (order.status === PaymentStatus.PAID) {
      return { success: true, message: 'Đơn hàng đã được kích hoạt trước đó' };
    }

    // Xác minh số tiền chuyển khoản (cho phép sai số nếu đã đủ)
    if (amount > 0 && amount < order.amount) {
      this.logger.warn(
        `Order ${orderCode} expected ${order.amount} VND but received ${amount} VND`,
      );
      return {
        success: false,
        message: `Số tiền chuyển (${amount} VND) nhỏ hơn giá trị đơn hàng (${order.amount} VND)`,
      };
    }

    // Kiểm tra chống trùng mã giao dịch ngoại vi (External Transaction ID replay attack)
    if (transactionCode) {
      const existingTx = await this.prisma.paymentOrder.findFirst({
        where: {
          transactionCode,
          status: PaymentStatus.PAID,
          id: { not: order.id },
        },
      });
      if (existingTx) {
        this.logger.warn(
          `External transaction code "${transactionCode}" was already redeemed for order #${existingTx.orderCode}`,
        );
        return {
          success: false,
          message: 'Mã giao dịch chuyển khoản này đã được sử dụng cho một đơn hàng khác trước đó.',
        };
      }
    }

    // Phát sự kiện lên RabbitMQ hàng đợi thanh toán với cơ chế Publisher Confirm & DLQ
    await this.rabbitMQ.publish(QUEUES.PAYMENT_WEBHOOK, {
      orderId: order.id,
      orderCode: order.orderCode,
      transactionCode,
      payload,
    });

    // Kích hoạt thành công đơn hàng & Subscription với Transaction an toàn và kiểm tra trạng thái nguyên tử
    await this.activateOrderAndSubscription(order, transactionCode, payload);

    return {
      success: true,
      message: `Đơn hàng ${orderCode} đã được thanh toán và kích hoạt thành công!`,
      orderCode,
    };
  }

  /**
   * Webhook xử lý từ PayOS Gateway
   */
  async handlePayOSWebhook(payload: any) {
    this.logger.log(`PayOS Webhook received: ${JSON.stringify(payload)}`);

    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
    if (checksumKey && payload.signature && payload.data) {
      // Xác minh chữ ký PayOS
      const isValid = this.verifyPayOSSignature(payload.data, payload.signature, checksumKey);
      if (!isValid) {
        throw new BadRequestException('Chữ ký PayOS không hợp lệ');
      }
    }

    const orderData = payload.data || payload;
    const orderCode = Number(orderData.orderCode);

    if (!orderCode) {
      throw new BadRequestException('Thiếu mã đơn hàng orderCode');
    }

    const order = await this.prisma.paymentOrder.findUnique({
      where: { orderCode },
      include: { plan: true },
    });

    if (!order) {
      return { success: false, message: 'Đơn hàng không tồn tại' };
    }

    if (order.status === PaymentStatus.PAID) {
      return { success: true, message: 'Đơn hàng đã thanh toán' };
    }

    const transactionCode = String(orderData.reference || 'PAYOS_WEBHOOK');

    // Chống trùng mã giao dịch ngoại vi
    if (transactionCode && transactionCode !== 'PAYOS_WEBHOOK') {
      const existingTx = await this.prisma.paymentOrder.findFirst({
        where: {
          transactionCode,
          status: PaymentStatus.PAID,
          id: { not: order.id },
        },
      });
      if (existingTx) {
        this.logger.warn(
          `PayOS transaction code "${transactionCode}" was already redeemed for order #${existingTx.orderCode}`,
        );
        return {
          success: false,
          message: 'Mã giao dịch PayOS đã được sử dụng trước đó.',
        };
      }
    }

    // Phát sự kiện lên RabbitMQ hàng đợi thanh toán với cơ chế Publisher Confirm & DLQ
    await this.rabbitMQ.publish(QUEUES.PAYMENT_WEBHOOK, {
      orderId: order.id,
      orderCode: order.orderCode,
      transactionCode,
      payload,
    });

    await this.activateOrderAndSubscription(
      order,
      transactionCode,
      payload,
    );

    return { success: true, code: '00', message: 'Kích hoạt thành công' };
  }

  /**
   * Phương thức hỗ trợ kích hoạt gói thanh toán trong chế độ Sandbox / Kiểm thử
   */
  async simulatePaymentSuccess(orderCode: number, currentUserId: string) {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { orderCode },
      include: { plan: true },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng cần mô phỏng');
    }

    // Bảo mật: Chặn người dùng tự kích hoạt miễn phí trong môi trường Production
    if (process.env.NODE_ENV === 'production') {
      const currentUser = await this.prisma.user.findUnique({ where: { id: currentUserId } });
      if (currentUser?.role !== Role.ADMIN && currentUser?.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenException('Tính năng mô phỏng thanh toán chỉ khả dụng cho Quản trị viên trên hệ thống thực tế.');
      }
    }

    if (order.userId !== currentUserId) {
      const currentUser = await this.prisma.user.findUnique({ where: { id: currentUserId } });
      if (currentUser?.role !== Role.ADMIN && currentUser?.role !== Role.SUPER_ADMIN) {
        throw new UnauthorizedException('Bạn không có quyền thao tác trên đơn hàng này');
      }
    }

    await this.activateOrderAndSubscription(
      order,
      `SIMULATED_${Date.now()}`,
      { simulated: true, byUserId: currentUserId },
    );

    return {
      success: true,
      message: `Mô phỏng thanh toán thành công! Gói ${order.plan.name} đã được kích hoạt.`,
      orderCode,
      tier: order.tier,
    };
  }

  /**
   * Kích hoạt đơn hàng, cập nhật Subscription và nâng cấp Role người dùng
   */
  private async activateOrderAndSubscription(
    order: any,
    transactionCode: string,
    webhookPayload: any,
  ) {
    const now = new Date();
    // Kiểm tra chu kỳ dựa trên số tiền: Gói năm (>= 500.000 VND) hưởng 365 ngày, gói tháng hưởng 30 ngày
    const isYearly = order.amount >= 500000;
    const durationDays = isYearly ? 365 : 30;
    const currentPeriodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction(async (tx) => {
      // 1. Kiểm tra trạng thái nguyên tử: Nếu đơn hàng đã PAID thì bỏ qua, chống kích hoạt kép
      const currentOrder = await tx.paymentOrder.findUnique({
        where: { id: order.id },
      });

      if (!currentOrder || currentOrder.status === PaymentStatus.PAID) {
        this.logger.warn(`Order #${order.orderCode} already marked as PAID. Skipping duplicate fulfillment.`);
        return;
      }

      // 2. Cập nhật trạng thái đơn hàng sang PAID
      await tx.paymentOrder.update({
        where: { id: order.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: now,
          transactionCode,
          webhookPayload,
        },
      });

      // 3. Hủy các subscription ACTIVE cũ của người dùng nếu có
      await tx.subscription.updateMany({
        where: { userId: order.userId, status: 'ACTIVE' },
        data: { status: 'SUPERSEDED' },
      });

      // 4. Tạo Subscription ACTIVE mới
      await tx.subscription.create({
        data: {
          userId: order.userId,
          planId: order.planId,
          status: 'ACTIVE',
          currentPeriodEnd,
        },
      });

      // 5. Cập nhật role người dùng lên PREMIUM_USER
      await tx.user.update({
        where: { id: order.userId },
        data: {
          role: Role.PREMIUM_USER,
        },
      });

      // 6. Ghi nhật ký hệ thống AuditLog
      await tx.auditLog.create({
        data: {
          actorId: order.userId,
          action: 'SUBSCRIPTION_UPGRADE_PAID',
          targetType: 'PAYMENT_ORDER',
          targetId: order.id,
          metadata: {
            orderCode: order.orderCode,
            tier: order.tier,
            amount: order.amount,
            method: order.paymentMethod,
            transactionCode,
          },
        },
      });
    });

    this.logger.log(
      `Successfully activated order ${order.orderCode} (tier: ${order.tier}) for user ${order.userId}`,
    );
  }

  /**
   * Xác thực chữ ký PayOS Webhook
   */
  private verifyPayOSSignature(data: any, signature: string, checksumKey: string): boolean {
    try {
      const sortedKeys = Object.keys(data).sort();
      const queryStr = sortedKeys.map((k) => `${k}=${data[k]}`).join('&');
      const expectedSignature = crypto
        .createHmac('sha256', checksumKey)
        .update(queryStr)
        .digest('hex');
      return expectedSignature === signature;
    } catch {
      return false;
    }
  }

  private getBankDisplayName(bankId: string): string {
    const bankMap: Record<string, string> = {
      MB: 'MB Bank (Quân Đội)',
      VCB: 'Vietcombank',
      TCB: 'Techcombank',
      VPB: 'VPBank',
      ACB: 'ACB (Á Châu)',
      BIDV: 'BIDV',
      VTB: 'VietinBank',
      TPB: 'TPBank',
    };
    return bankMap[bankId.toUpperCase()] || bankId.toUpperCase();
  }

  async upgradePlan(userId: string, tier: SubscriptionTier) {
    return this.createPaymentOrder(userId, tier, PaymentMethod.VIETQR);
  }

  // =========================================================================
  // ADMIN PLAN & SUBSCRIPTION MANAGEMENT
  // =========================================================================

  async adminGetAllPlans() {
    await this.ensureDefaultPlans();
    const plans = await this.prisma.plan.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: {
            subscriptions: { where: { status: 'ACTIVE' } },
            paymentOrders: { where: { status: PaymentStatus.PAID } },
          },
        },
      },
    });

    return plans.map((p) => ({
      ...p,
      activeUsersCount: p._count.subscriptions,
      totalPaidOrders: p._count.paymentOrders,
    }));
  }

  async adminCreatePlan(dto: any, actorId?: string) {
    const {
      tier,
      name,
      slug,
      description,
      priceMonthly,
      priceYearly,
      currency = 'VND',
      billingCycle = 'MONTHLY',
      status = 'ACTIVE',
      displayOrder = 0,
      aiDailyQuota = 10,
      maxCustomDecks = 5,
      features = [],
      limits,
      permissions,
    } = dto;

    if (!tier || !name) {
      throw new BadRequestException('Vui lòng cung cấp mã gói (tier) và tên gói (name)');
    }

    const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await this.prisma.plan.findFirst({
      where: {
        OR: [{ tier }, { slug: cleanSlug }],
      },
    });

    if (existing) {
      throw new BadRequestException(`Gói với tier ${tier} hoặc slug ${cleanSlug} đã tồn tại`);
    }

    return this.prisma.plan.create({
      data: {
        tier,
        name,
        slug: cleanSlug,
        description,
        priceMonthly: Number(priceMonthly) || 0,
        priceYearly: Number(priceYearly) || 0,
        currency,
        billingCycle,
        status,
        displayOrder: Number(displayOrder) || 0,
        aiDailyQuota: Number(aiDailyQuota) || 10,
        maxCustomDecks: Number(maxCustomDecks) || 5,
        features: Array.isArray(features) ? features : [],
        limits: limits || {},
        permissions: permissions || {},
      },
    });
  }

  async adminUpdatePlan(id: string, dto: any, actorId?: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Không tìm thấy gói cước cần cập nhật');

    const dataToUpdate: any = {};
    if (dto.name !== undefined) dataToUpdate.name = dto.name;
    if (dto.slug !== undefined) dataToUpdate.slug = dto.slug;
    if (dto.description !== undefined) dataToUpdate.description = dto.description;
    if (dto.priceMonthly !== undefined) dataToUpdate.priceMonthly = Number(dto.priceMonthly);
    if (dto.priceYearly !== undefined) dataToUpdate.priceYearly = Number(dto.priceYearly);
    if (dto.currency !== undefined) dataToUpdate.currency = dto.currency;
    if (dto.billingCycle !== undefined) dataToUpdate.billingCycle = dto.billingCycle;
    if (dto.status !== undefined) dataToUpdate.status = dto.status;
    if (dto.displayOrder !== undefined) dataToUpdate.displayOrder = Number(dto.displayOrder);
    if (dto.aiDailyQuota !== undefined) dataToUpdate.aiDailyQuota = Number(dto.aiDailyQuota);
    if (dto.maxCustomDecks !== undefined) dataToUpdate.maxCustomDecks = Number(dto.maxCustomDecks);
    if (dto.features !== undefined) dataToUpdate.features = dto.features;
    if (dto.limits !== undefined) dataToUpdate.limits = dto.limits;
    if (dto.permissions !== undefined) dataToUpdate.permissions = dto.permissions;

    return this.prisma.plan.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async adminDeletePlan(id: string, actorId?: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: { where: { status: 'ACTIVE' } },
          },
        },
      },
    });

    if (!plan) throw new NotFoundException('Không tìm thấy gói cước');

    if (plan._count.subscriptions > 0) {
      throw new BadRequestException(
        `Plan "${plan.name}" đang có ${plan._count.subscriptions} học viên sử dụng. Hãy chuyển trạng thái sang Archive thay vì xóa cứng!`,
      );
    }

    if (plan.tier === SubscriptionTier.FREE) {
      throw new BadRequestException('Không thể xóa gói mặc định Learner Free');
    }

    return this.prisma.plan.delete({ where: { id } });
  }

  async adminArchivePlan(id: string, actorId?: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Không tìm thấy gói cước');
    if (plan.tier === SubscriptionTier.FREE) {
      throw new BadRequestException('Không thể lưu trữ gói mặc định Learner Free');
    }

    return this.prisma.plan.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  /**
   * Quản lý trạng thái đóng/mở Cổng Thanh Toán (Tuân thủ đăng ký Bộ Công Thương / Nghị định 52)
   */
  async getPaymentGatewayStatus() {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: 'CONFIG_PAYMENT_GATEWAY' },
    });

    const defaultReason =
      'Hệ thống đang tạm ngừng tính năng nạp tiền để hoàn tất thủ tục đăng ký / thông báo với Bộ Công Thương theo Nghị định 52/2013/NĐ-CP. Quý học viên vẫn có thể học miễn phí bình thường!';

    if (!config?.value) {
      return {
        enabled: true,
        reason: defaultReason,
        updatedAt: null,
      };
    }

    try {
      const data = JSON.parse(config.value);
      return {
        enabled: data.enabled !== false,
        reason: data.reason || defaultReason,
        updatedAt: config.updatedAt,
        updatedBy: data.updatedBy,
      };
    } catch {
      return {
        enabled: true,
        reason: defaultReason,
        updatedAt: config.updatedAt,
      };
    }
  }

  async setPaymentGatewayStatus(enabled: boolean, reason?: string, actorId?: string) {
    const defaultReason =
      'Hệ thống đang tạm ngừng tính năng nạp tiền để hoàn tất thủ tục đăng ký / thông báo với Bộ Công Thương theo Nghị định 52/2013/NĐ-CP. Quý học viên vẫn có thể học miễn phí bình thường!';

    const value = JSON.stringify({
      enabled: Boolean(enabled),
      reason: reason?.trim() || defaultReason,
      updatedBy: actorId,
      updatedAt: new Date().toISOString(),
    });

    await this.prisma.systemConfig.upsert({
      where: { key: 'CONFIG_PAYMENT_GATEWAY' },
      create: {
        key: 'CONFIG_PAYMENT_GATEWAY',
        value,
        description: 'Payment gateway kill switch and Ministry of Industry & Trade compliance status',
      },
      update: {
        value,
        updatedAt: new Date(),
      },
    });

    this.logger.warn(
      `[PAYMENT GATEWAY ${enabled ? 'ENABLED' : 'PAUSED'}] By admin ${actorId}. Reason: ${reason || defaultReason}`,
    );

    return {
      success: true,
      enabled: Boolean(enabled),
      reason: reason?.trim() || defaultReason,
    };
  }
}

