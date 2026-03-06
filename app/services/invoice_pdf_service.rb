# frozen_string_literal: true

class InvoicePdfService
  def initialize(order)
    @order = order
    @owner = order.orderable
    @product = order.product
  end

  def generate
    pdf = Prawn::Document.new(page_size: 'A4', margin: 40)

    # Header
    pdf.font_size(24) { pdf.text 'INVOICE', style: :bold, color: '1a1a2e' }
    pdf.move_down 5
    pdf.font_size(10) { pdf.text 'ProxySock', color: '6366f1' }
    pdf.font_size(8) { pdf.text 'Premium Proxy & VPN Services', color: '888888' }

    pdf.move_down 20
    pdf.stroke_horizontal_rule
    pdf.move_down 15

    # Invoice details
    pdf.font_size(9)

    invoice_data = [
      ['Invoice Number:', @order.order_number],
      ['Date:', @order.created_at&.strftime('%B %d, %Y') || 'N/A'],
      ['Status:', @order.status&.capitalize || 'N/A']
    ]

    invoice_data.each do |label, value|
      pdf.text "#{label} #{value}", color: '333333'
      pdf.move_down 3
    end

    pdf.move_down 15

    # Bill To
    pdf.font_size(10) { pdf.text 'Bill To:', style: :bold, color: '1a1a2e' }
    pdf.move_down 5
    pdf.font_size(9)
    pdf.text(@owner.try(:username) || @owner.try(:email) || 'Customer', color: '333333')
    pdf.text(@owner.try(:email) || '', color: '666666')

    pdf.move_down 20

    # Order Details Table
    table_data = [
      [
        { content: 'Item', font_style: :bold },
        { content: 'Qty', font_style: :bold },
        { content: 'Amount', font_style: :bold }
      ],
      [
        @product&.name || 'Product',
        (@order.quantity || 1).to_s,
        format_currency(@order.total_amount)
      ]
    ]

    # Add period info if available
    if @order.metadata&.dig('period').present?
      period = @order.metadata['period']
      table_data[1][0] = "#{@product&.name || 'Product'} (#{period} month#{'s' if period.to_i > 1})"
    end

    pdf.table(table_data, width: pdf.bounds.width) do |t|
      t.row(0).background_color = 'f0f0ff'
      t.row(0).text_color = '1a1a2e'
      t.cells.padding = [8, 10]
      t.cells.borders = [:bottom]
      t.cells.border_color = 'e0e0e0'
      t.column(1).align = :center
      t.column(2).align = :right
    end

    pdf.move_down 10

    # Total
    pdf.font_size(12)
    pdf.text "Total: #{format_currency(@order.total_amount)}", style: :bold, align: :right, color: '1a1a2e'

    pdf.move_down 30

    # Payment info
    if @order.metadata&.dig('transaction_id').present?
      pdf.font_size(8)
      pdf.text "Transaction ID: #{@order.metadata['transaction_id']}", color: '888888'
    end

    pdf.move_down 10
    pdf.stroke_horizontal_rule
    pdf.move_down 10

    # Footer
    pdf.font_size(8)
    pdf.text 'Thank you for your business!', color: '666666', align: :center
    pdf.text 'ProxySock - Premium Proxy & VPN Services', color: '888888', align: :center
    pdf.text 'support@proxysock.com', color: '6366f1', align: :center

    pdf.render
  end

  def generate_and_attach!
    pdf_content = generate
    @order.invoice_pdf.attach(
      io: StringIO.new(pdf_content),
      filename: "invoice-#{@order.order_number}.pdf",
      content_type: 'application/pdf'
    )
  end

  private

  def format_currency(amount)
    "$#{format('%.2f', amount || 0)} USD"
  end
end
