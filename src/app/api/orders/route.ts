import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
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

    if (deliveryMethod === 'local_delivery') {
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

    // Update customer phone if missing
    if (!session.profile.phone && customerPhone) {
      await supabase
        .from('user_profiles')
        .update({ phone: customerPhone.trim() })
        .eq('id', session.userId);
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_order_from_cart', {
      p_user_id: session.userId,
      p_customer_name: customerName.trim(),
      p_customer_email: customerEmail.trim(),
      p_customer_phone: customerPhone.trim(),
      p_delivery_method: deliveryMethod,
      p_shipping_address: deliveryMethod === 'local_delivery' ? shippingAddress : null,
      p_customer_notes: customerNotes || '',
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 400 });
    }

    const orderId = rpcResult?.order_id;
    const { data: fullOrder } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    return NextResponse.json({
      order: fullOrder
        ? {
            ...fullOrder,
            items: fullOrder.order_items || [],
          }
        : null,
      orderId,
      orderNumber: rpcResult?.order_number,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao processar pedido.' },
      { status: 500 }
    );
  }
}
