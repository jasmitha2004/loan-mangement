import csv
import io
import logging
from django.http import HttpResponse
from datetime import datetime

logger = logging.getLogger(__name__)

def export_leads_csv(queryset, filter_summary="All Leads"):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="leads_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
    
    writer = csv.writer(response)
    writer.writerow(["BANK / NBFC LOAN ELIGIBILITY REPORT"])
    writer.writerow([f"Generated On: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", f"Applied Filter: {filter_summary}", f"Total Records: {queryset.count()}"])
    writer.writerow([]) # Blank row
    
    writer.writerow([
        'Lead ID', 'Customer Name', 'Mobile Number', 'Email', 'City', 'State',
        'Loan Type', 'Employment Type', 'Monthly Income (INR)', 'Loan Amount (INR)',
        'Property Value (INR)', 'Credit Score', 'BRE Status', 'Created Date'
    ])
    
    for lead in queryset:
        c = lead.customer
        writer.writerow([
            lead.id,
            c.full_name if c else 'N/A',
            c.mobile_number if c else 'N/A',
            c.email if c else 'N/A',
            c.city if c else 'N/A',
            c.state if c else 'N/A',
            lead.loan_type,
            lead.employment_type,
            float(lead.monthly_income),
            float(lead.loan_amount),
            float(lead.property_value),
            lead.credit_score or 'N/A',
            lead.bre_status,
            lead.created_at.strftime('%Y-%m-%d %H:%M') if lead.created_at else ''
        ])
    return response

def export_leads_excel(queryset, filter_summary="All Leads"):
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Loan Leads Report"
    
    # Title Banner (Row 1)
    ws.merge_cells('A1:N1')
    title_cell = ws['A1']
    title_cell.value = "LOANSPHERE - EXECUTIVE LEAD MANAGEMENT REPORT"
    title_cell.font = Font(size=14, bold=True, color="FFFFFF")
    title_cell.fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    title_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 30
    
    # Subtitle Metadata (Row 2)
    ws.merge_cells('A2:N2')
    sub_cell = ws['A2']
    sub_cell.value = f"Generated On: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  |  Filter: {filter_summary}  |  Total Leads: {queryset.count()}"
    sub_cell.font = Font(size=10, italic=True, color="475569")
    sub_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[2].height = 20
    
    headers = [
        'Lead ID', 'Customer Name', 'Mobile Number', 'Email', 'City', 'State',
        'Loan Type', 'Employment Type', 'Monthly Income (INR)', 'Loan Amount (INR)',
        'Property Value (INR)', 'Credit Score', 'BRE Status', 'Created Date'
    ]
    
    ws.append([]) # Empty row 3
    ws.append(headers) # Row 4
    ws.row_dimensions[4].height = 24
    
    header_fill = PatternFill(start_color="3B82F6", end_color="3B82F6", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True, size=10)
    
    for col_num in range(1, 15):
        cell = ws.cell(row=4, column=col_num)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        
    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )
    
    row_idx = 5
    for lead in queryset:
        c = lead.customer
        row_data = [
            lead.id,
            c.full_name if c else 'N/A',
            c.mobile_number if c else 'N/A',
            c.email if c else 'N/A',
            c.city if c else 'N/A',
            c.state if c else 'N/A',
            lead.loan_type,
            lead.employment_type,
            float(lead.monthly_income),
            float(lead.loan_amount),
            float(lead.property_value),
            lead.credit_score or 0,
            lead.bre_status,
            lead.created_at.strftime('%Y-%m-%d %H:%M') if lead.created_at else ''
        ]
        ws.append(row_data)
        
        # Format data cells
        for col_idx in range(1, 15):
            cell = ws.cell(row=row_idx, column=col_idx)
            cell.border = thin_border
            cell.font = Font(size=9)
            if col_idx in [9, 10, 11]: # Currency columns
                cell.number_format = '#,##0.00'
            if col_idx in [1, 3, 12, 13]: # Center ID, Mobile, Score, Status
                cell.alignment = Alignment(horizontal="center")
        row_idx += 1
        
    # Auto-adjust column widths using get_column_letter to avoid MergedCell AttributeError
    for col_idx in range(1, 15):
        col_letter = get_column_letter(col_idx)
        max_len = max(len(str(ws.cell(row=r, column=col_idx).value or '')) for r in range(4, ws.max_row + 1)) if ws.max_row >= 4 else 12
        ws.column_dimensions[col_letter].width = max(max_len + 4, 14)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    response = HttpResponse(
        buffer.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="leads_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx"'
    return response

def export_leads_pdf(queryset, filter_summary="All Leads"):
    from reportlab.lib.pagesizes import letter, landscape
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        rightMargin=25,
        leftMargin=25,
        topMargin=25,
        bottomMargin=25
    )
    elements = []
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=16,
        leading=20,
        spaceAfter=4,
        textColor=colors.HexColor('#0F172A')
    )
    
    sub_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=12
    )
    
    elements.append(Paragraph("LoanPilot Executive Lead Management & BRE Report", title_style))
    elements.append(Paragraph(
        f"Generated: <b>{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</b> | Filter: <b>{filter_summary}</b> | Total Matching Leads: <b>{queryset.count()}</b>",
        sub_style
    ))
    
    headers = ['ID', 'Customer Name', 'Mobile', 'City', 'Loan Type', 'Income (Rs)', 'Loan Amt (Rs)', 'Score', 'BRE Status', 'Date']
    table_data = [headers]
    
    lead_list = list(queryset[:200])
    
    if len(lead_list) == 0:
        table_data.append(['-', 'No leads found matching criteria', '-', '-', '-', '-', '-', '-', '-', '-'])
    else:
        for lead in lead_list:
            c = lead.customer
            table_data.append([
                str(lead.id),
                str(c.full_name)[:16] if c else 'N/A',
                str(c.mobile_number) if c else 'N/A',
                str(c.city)[:12] if c else 'N/A',
                str(lead.loan_type)[:14],
                f"Rs. {int(lead.monthly_income):,}",
                f"Rs. {int(lead.loan_amount):,}",
                str(lead.credit_score or '-'),
                str(lead.bre_status),
                lead.created_at.strftime('%Y-%m-%d') if lead.created_at else ''
            ])
            
    col_widths = [35, 110, 75, 75, 100, 85, 95, 45, 65, 57]
    
    t = Table(table_data, colWidths=col_widths)
    t_style = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 5),
        ('TOPPADDING', (0, 0), (-1, 0), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
    ]
    
    if len(lead_list) > 0:
        for r_idx in range(1, len(table_data)):
            bg_color = colors.HexColor('#F8FAFC') if r_idx % 2 == 1 else colors.white
            t_style.append(('BACKGROUND', (0, r_idx), (-1, r_idx), bg_color))
            
    t.setStyle(TableStyle(t_style))
    elements.append(t)
    
    doc.build(elements)
    
    buffer.seek(0)
    response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="leads_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
    return response
