import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getStoreSettings } from '@/lib/catalog';
import { normalizeCheckoutDeliveryConfig } from '@/lib/checkout-config';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Faça login para finalizar o pedido.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      deliveryMethod,
      shippingAddress,
      customerNotes,
    } = body;

    if (!customerName?.trim() || !customerEmail?.trim() || !customerPhone?.trim()) {
      return NextResponse.json(
        { error: 'Preencha nome completo, e-mail e telefone/WhatsApp.' },
        { status: 400 }
      );
    }

    const settings = await getStoreSettings();
    const deliveryCfg = normalizeCheckoutDeliveryConfig(settings.checkout_delivery_config);

    if (deliveryMethod === 'local_delivery' && deliveryCfg.require_address_on_delivery) {
      if (
        !shippingAddress?.street?.trim() ||
        !shippingAddress?.number?.trim() ||
        !shippingAddress?.neighborhood?.trim() ||
        !shippingAddress?.city?.trim()
      ) {
        return NextResponse.json(
          { error: 'Preencha o endereço completo para entrega local.' },
          { status: 400 }
        );
      }
    }

    const supabase = createServiceClient();

    const phoneUpdatePromise =
      !session.profile.phone && customerPhone
        ? supabase
            .from('user_profiles')
            .update({ phone: customerPhone.trim() })
            .eq('id', session.userId)
        : Promise.resolve();

    const [{ data: rpcResult, error: rpcError }] = await Promise.all([
      supabase.rpc('create_order_from_cart', {
        p_user_id: session.userId,
        p_customer_name: customerName.trim(),
        p_customer_email: customerEmail.trim(),
        p_customer_phone: customerPhone.trim(),
        p_delivery_method: deliveryMethod === 'local_delivery' ? 'local_delivery' : 'pickup',
        p_shipping_address: deliveryMethod === 'local_delivery' ? shippingAddress : null,
        p_customer_notes: customerNotes || '',
      }),
      phoneUpdatePromise,
    ]);

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 400 });
    }

    revalidateTag('catalog', { expire: 0 });
    revalidatePath('/admin', 'layout');

    const r = rpcResult as { order_id?: string; order_number?: string } | null;
    const orderId = r?.order_id;
    const { data: fullOrder } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId!)
      .single();

    const orderData = fullOrder as Record<string, unknown> | null;

    return NextResponse.json({
      order: orderData
        ? {
            ...orderData,
            items: (orderData.order_items as unknown[]) || [],
          }
        : null,
      orderId,
      orderNumber: r?.order_number,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao processar pedido.' },
      { status: 500 }
    );
  }
}
