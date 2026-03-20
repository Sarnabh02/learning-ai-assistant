"""
Beautiful multi-section PDF summary.
Uses reportlab Platypus for automatic page-breaking with a clean white design.
"""

from io import BytesIO
from datetime import date
import html as _html

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.lib.utils import simpleSplit
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, NextPageTemplate,
    Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether,
)

# ── Palette ────────────────────────────────────────────────────────────────────

C_VIOLET_DARK  = colors.HexColor("#3b0764")
C_VIOLET_HEAD  = colors.HexColor("#5b21b6")
C_VIOLET       = colors.HexColor("#7c3aed")
C_VIOLET_LIGHT = colors.HexColor("#f5f3ff")
C_VIOLET_MID   = colors.HexColor("#ddd6fe")
C_INK          = colors.HexColor("#1e1b4b")
C_BODY         = colors.HexColor("#374151")
C_MUTED        = colors.HexColor("#6b7280")
C_RULE         = colors.HexColor("#e5e7eb")
C_WHITE        = colors.white
C_FAINT        = colors.HexColor("#fafafe")

C_EASY_BG  = colors.HexColor("#d1fae5")
C_EASY_FG  = colors.HexColor("#065f46")
C_MED_BG   = colors.HexColor("#fef3c7")
C_MED_FG   = colors.HexColor("#92400e")
C_HARD_BG  = colors.HexColor("#fee2e2")
C_HARD_FG  = colors.HexColor("#991b1b")

DIFF = {
    "easy":   (C_EASY_BG, C_EASY_FG),
    "medium": (C_MED_BG,  C_MED_FG),
    "hard":   (C_HARD_BG, C_HARD_FG),
}

# ── Page geometry ──────────────────────────────────────────────────────────────

W, H     = A4                 # 595.27 × 841.89 pt
ML = MR  = 18 * mm            # side margins ≈ 51 pt
MB       = 20 * mm            # bottom margin
CW       = W - ML - MR        # content width ≈ 493 pt
HEADER_H = 82                 # first-page header band height
FOOT_RES = 24                 # space reserved for footer

# ── Style factory ──────────────────────────────────────────────────────────────

def _S(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9.5, leading=14, textColor=C_BODY)
    base.update(kw)
    return ParagraphStyle(name, **base)

SEC_ST  = _S("SEC",  fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=C_VIOLET)
OBJ_ST  = _S("OBJ",  fontSize=9.5, leading=15, leftIndent=14, firstLineIndent=-12)
CONC_ST = _S("CONC", fontName="Helvetica-Oblique", fontSize=8.5, leading=12, textColor=C_MUTED)
PCRD_ST = _S("PCRD", fontSize=9, leading=14, textColor=C_BODY)
DSTEP_ST= _S("DS",   fontSize=9, leading=14, textColor=C_BODY)
EXBD_ST = _S("EXB",  fontSize=8.5, leading=13, textColor=C_BODY)
PSTMT_ST= _S("PST",  fontSize=9.5, leading=14, textColor=C_INK)

# ── Helpers ─────────────────────────────────────────────────────────────────────

def _x(text: str) -> str:
    """Escape HTML special chars for Paragraph markup."""
    return _html.escape(str(text))


def _hr(before: int = 4, after: int = 4):
    return HRFlowable(width="100%", thickness=0.5, color=C_RULE,
                      spaceBefore=before, spaceAfter=after)


def _ts(*cmds) -> TableStyle:
    return TableStyle(list(cmds))


# ── Canvas decorations ────────────────────────────────────────────────────────

def _draw_footer(c, page_num: int):
    fy = MB - 6
    c.setStrokeColor(C_RULE)
    c.setLineWidth(0.5)
    c.line(ML, fy, W - MR, fy)
    c.setFont("Helvetica", 7)
    c.setFillColor(C_MUTED)
    c.drawString(ML, fy - 11, "First Principles Learning Summary")
    c.drawRightString(W - MR, fy - 11, f"Page {page_num}")


def _page_first(c, doc):
    data = doc._pdf_data
    c.saveState()

    # White background
    c.setFillColor(C_WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Header band — two-layer for depth
    c.setFillColor(C_VIOLET_DARK)
    c.rect(0, H - HEADER_H, W, HEADER_H, fill=1, stroke=0)
    c.setFillColor(C_VIOLET_HEAD)
    c.rect(0, H - HEADER_H + 4, W, HEADER_H - 10, fill=1, stroke=0)

    # Subtle decorative circles
    c.setFillColorRGB(1, 1, 1, 0.05)
    c.circle(W - 55, H - 28, 95, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1, 0.03)
    c.circle(W + 10, H + 10, 65, fill=1, stroke=0)

    # Title
    topic = data.get("topic", "Learning Summary")
    lines = simpleSplit(topic, "Helvetica-Bold", 22, CW - 20)
    ty = H - 26
    c.setFont("Helvetica-Bold", 22)
    c.setFillColor(C_WHITE)
    for line in lines[:2]:
        c.drawString(ML, ty, line)
        ty -= 27

    # Meta pills (domain + difficulty)
    def _pill(text, px, py):
        c.setFont("Helvetica-Bold", 7.5)
        tw = c.stringWidth(text, "Helvetica-Bold", 7.5)
        bw, bh = tw + 14, 16
        c.setFillColorRGB(1, 1, 1, 0.18)
        c.roundRect(px, py - 4, bw, bh, 4, fill=1, stroke=0)
        c.setFillColorRGB(1, 1, 1)
        c.drawString(px + 7, py + 3, text)
        return px + bw + 5

    px = ML
    my = ty + 6
    if data.get("domain"):
        px = _pill(data["domain"], px, my)
    if data.get("difficulty"):
        _pill(data["difficulty"].capitalize(), px, my)

    _draw_footer(c, 1)
    c.restoreState()


def _page_later(c, doc):
    c.saveState()
    # Thin top strip
    c.setFillColor(C_VIOLET)
    c.rect(0, H - 4, W, 4, fill=1, stroke=0)
    # Topic name top-right
    c.setFont("Helvetica", 7.5)
    c.setFillColor(C_MUTED)
    c.drawRightString(W - MR, H - 13,
                      f"{doc._pdf_data.get('topic', '')}  ·  Page {doc.page}")
    _draw_footer(c, doc.page)
    c.restoreState()


# ── Section components ────────────────────────────────────────────────────────

def _section_head(title: str) -> Table:
    """Violet left-bar + section title."""
    t = Table([["", Paragraph(title, SEC_ST)]], colWidths=[3, CW - 3])
    t.setStyle(_ts(
        ("BACKGROUND",    (0, 0), (0, 0), C_VIOLET),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ("LEFTPADDING",   (1, 0), (1, 0), 9),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ))
    return t


def _principle_card(num: int, title: str, statement: str, why: str) -> Table:
    """Numbered card with title, statement, and why-fundamental."""
    badge_col = 32
    text_col  = CW - badge_col

    badge_p = Paragraph(
        f'<font color="white"><b>{_x(str(num))}</b></font>',
        _S("bn", fontName="Helvetica-Bold", fontSize=11, leading=14,
           alignment=TA_CENTER, textColor=C_WHITE),
    )
    body_html = (
        f'<b><font size="10" color="#1e1b4b">{_x(title)}</font></b><br/>'
        f'<font size="9">{_x(statement)}</font><br/>'
        f'<font size="8" color="#6b7280"><i>Why fundamental: {_x(why)}</i></font>'
    )
    body_p = Paragraph(body_html, PCRD_ST)

    t = Table([[badge_p, body_p]], colWidths=[badge_col, text_col])
    t.setStyle(_ts(
        ("BACKGROUND",    (0, 0), (0, 0), C_VIOLET),
        ("BACKGROUND",    (1, 0), (1, 0), C_VIOLET_LIGHT),
        ("BOX",           (0, 0), (-1, -1), 0.6, C_VIOLET_MID),
        ("TOPPADDING",    (0, 0), (0, 0), 12),
        ("BOTTOMPADDING", (0, 0), (0, 0), 12),
        ("LEFTPADDING",   (0, 0), (0, 0), 0),
        ("RIGHTPADDING",  (0, 0), (0, 0), 0),
        ("TOPPADDING",    (1, 0), (1, 0), 10),
        ("BOTTOMPADDING", (1, 0), (1, 0), 10),
        ("LEFTPADDING",   (1, 0), (1, 0), 11),
        ("RIGHTPADDING",  (1, 0), (1, 0), 11),
        ("ALIGN",         (0, 0), (0, 0), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ))
    return t


def _step_card(num, claim: str, reasoning: str) -> Table:
    """Derivation step: violet step badge + claim + reasoning."""
    step_col = 46
    text_col  = CW - step_col

    step_p = Paragraph(
        f'<font color="white"><b>Step<br/>{_x(str(num))}</b></font>',
        _S("sc", fontName="Helvetica-Bold", fontSize=8.5, leading=12,
           alignment=TA_CENTER, textColor=C_WHITE),
    )
    body_html = (
        f'<b><font size="9.5" color="#1e1b4b">{_x(claim)}</font></b><br/>'
        f'<font size="8.5" color="#374151">{_x(reasoning)}</font>'
    )
    body_p = Paragraph(body_html, DSTEP_ST)

    t = Table([[step_p, body_p]], colWidths=[step_col, text_col])
    t.setStyle(_ts(
        ("BACKGROUND",    (0, 0), (0, 0), C_VIOLET),
        ("BACKGROUND",    (1, 0), (1, 0), C_WHITE),
        ("BOX",           (0, 0), (-1, -1), 0.5, C_RULE),
        ("LINEAFTER",     (0, 0), (0, 0), 0.5, C_RULE),
        ("TOPPADDING",    (0, 0), (0, 0), 10),
        ("BOTTOMPADDING", (0, 0), (0, 0), 10),
        ("LEFTPADDING",   (0, 0), (0, 0), 0),
        ("RIGHTPADDING",  (0, 0), (0, 0), 0),
        ("TOPPADDING",    (1, 0), (1, 0), 9),
        ("BOTTOMPADDING", (1, 0), (1, 0), 9),
        ("LEFTPADDING",   (1, 0), (1, 0), 11),
        ("RIGHTPADDING",  (1, 0), (1, 0), 11),
        ("ALIGN",         (0, 0), (0, 0), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ))
    return t


def _example_card(num: int, title: str, problem: str, solution: str) -> Table:
    """Worked example: violet header row + problem + solution."""
    header_p = Paragraph(
        f'<font color="white"><b>Example {_x(str(num))}  ·  {_x(title)}</b></font>',
        _S("eh", fontName="Helvetica-Bold", fontSize=9.5, leading=13, textColor=C_WHITE),
    )
    prob_p = Paragraph(
        f'<b><font color="#1e1b4b">Problem: </font></b>{_x(problem)}',
        EXBD_ST,
    )
    soln_p = Paragraph(
        f'<b><font color="#1e1b4b">Solution: </font></b>{_x(solution)}',
        EXBD_ST,
    )

    t = Table([[header_p], [prob_p], [soln_p]], colWidths=[CW])
    t.setStyle(_ts(
        ("BACKGROUND",    (0, 0), (0, 0), C_VIOLET),
        ("BACKGROUND",    (0, 1), (0, -1), C_FAINT),
        ("BOX",           (0, 0), (-1, -1), 0.6, C_VIOLET_MID),
        ("LINEBELOW",     (0, 0), (0, 0), 0.6, C_VIOLET_MID),
        ("LINEBELOW",     (0, 1), (0, 1), 0.3, C_RULE),
        ("TOPPADDING",    (0, 0), (0, 0), 9),
        ("BOTTOMPADDING", (0, 0), (0, 0), 9),
        ("TOPPADDING",    (0, 1), (0, -1), 8),
        ("BOTTOMPADDING", (0, 1), (0, -1), 8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 13),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 13),
    ))
    return t


def _problem_card(num: int, diff: str, statement: str) -> Table:
    """Practice problem card with coloured difficulty badge."""
    bg, fg = DIFF.get(diff.lower(), (C_RULE, C_BODY))
    badge_col = 46
    text_col  = CW - badge_col

    # Badge: #N over DIFFICULTY
    badge_p = Paragraph(
        f'<b><font size="11">{_x(f"#{num}")}</font></b><br/>'
        f'<font size="7"><b>{_x(diff.upper())}</b></font>',
        _S("pb", fontName="Helvetica-Bold", fontSize=11, leading=14,
           alignment=TA_CENTER, textColor=fg),
    )
    stmt_p = Paragraph(_x(statement), PSTMT_ST)

    t = Table([[badge_p, stmt_p]], colWidths=[badge_col, text_col])
    t.setStyle(_ts(
        ("BACKGROUND",    (0, 0), (0, 0), bg),
        ("BACKGROUND",    (1, 0), (1, 0), C_WHITE),
        ("BOX",           (0, 0), (-1, -1), 0.4, C_RULE),
        ("LINEAFTER",     (0, 0), (0, 0), 0.4, C_RULE),
        ("TOPPADDING",    (0, 0), (0, 0), 8),
        ("BOTTOMPADDING", (0, 0), (0, 0), 8),
        ("LEFTPADDING",   (0, 0), (0, 0), 0),
        ("RIGHTPADDING",  (0, 0), (0, 0), 0),
        ("TOPPADDING",    (1, 0), (1, 0), 10),
        ("BOTTOMPADDING", (1, 0), (1, 0), 10),
        ("LEFTPADDING",   (1, 0), (1, 0), 13),
        ("RIGHTPADDING",  (1, 0), (1, 0), 11),
        ("ALIGN",         (0, 0), (0, 0), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ))
    return t


# ── Entry point ────────────────────────────────────────────────────────────────

def generate_summary_pdf(data: dict) -> bytes:
    """
    Build a complete, beautifully formatted PDF summary.

    Expected data keys:
      topic, domain, difficulty, learningObjectives, focusConcepts,
      firstPrinciples  [{title, statement, whyFundamental}],
      derivation        [{step, claim, reasoning}],
      workedExamples    [{title, problem, solution}],
      practiceProblems  [{difficulty, statement}]
    """
    buf = BytesIO()

    doc = BaseDocTemplate(buf, pagesize=A4,
                          leftMargin=0, rightMargin=0,
                          topMargin=0, bottomMargin=0)
    doc._pdf_data = data

    first_frame = Frame(
        ML, MB + FOOT_RES,
        CW, H - HEADER_H - 10 * mm - MB - FOOT_RES,
        id="first", leftPadding=0, rightPadding=0, topPadding=10, bottomPadding=0,
    )
    later_frame = Frame(
        ML, MB + FOOT_RES,
        CW, H - 10 * mm - MB - FOOT_RES,
        id="later", leftPadding=0, rightPadding=0, topPadding=10, bottomPadding=0,
    )

    doc.addPageTemplates([
        PageTemplate(id="First", frames=[first_frame], onPage=_page_first),
        PageTemplate(id="Later", frames=[later_frame], onPage=_page_later),
    ])

    story: list = [NextPageTemplate("Later")]

    # ── Learning Objectives ────────────────────────────────────────────────
    story += [_section_head("LEARNING OBJECTIVES"), Spacer(1, 8)]

    for obj in data.get("learningObjectives", []):
        story.append(Paragraph(f"›  {_x(obj)}", OBJ_ST))
        story.append(Spacer(1, 3))

    if data.get("focusConcepts"):
        story += [
            Spacer(1, 6),
            Paragraph(
                "Key concepts:  " + "  ·  ".join(map(_x, data["focusConcepts"])),
                CONC_ST,
            ),
        ]

    story.append(Spacer(1, 20))

    # ── Key First Principles ───────────────────────────────────────────────
    story += [_section_head("KEY FIRST PRINCIPLES"), Spacer(1, 9)]

    for i, p in enumerate(data.get("firstPrinciples", []), 1):
        story.append(KeepTogether([
            _principle_card(
                i,
                p.get("title", f"Principle {i}"),
                p.get("statement", ""),
                p.get("whyFundamental", ""),
            ),
            Spacer(1, 7),
        ]))

    story.append(Spacer(1, 14))

    # ── Logical Derivation ─────────────────────────────────────────────────
    story += [_section_head("LOGICAL DERIVATION"), Spacer(1, 9)]

    for s in data.get("derivation", []):
        story.append(KeepTogether([
            _step_card(
                s.get("step", "?"),
                s.get("claim", ""),
                s.get("reasoning", ""),
            ),
            Spacer(1, 6),
        ]))

    story.append(Spacer(1, 14))

    # ── Worked Examples ────────────────────────────────────────────────────
    if data.get("workedExamples"):
        story += [_section_head("WORKED EXAMPLES"), Spacer(1, 9)]

        for i, ex in enumerate(data["workedExamples"], 1):
            story.append(KeepTogether([
                _example_card(
                    i,
                    ex.get("title", f"Example {i}"),
                    ex.get("problem", ""),
                    ex.get("solution", ""),
                ),
                Spacer(1, 7),
            ]))

        story.append(Spacer(1, 14))

    # ── Practice Problems ──────────────────────────────────────────────────
    if data.get("practiceProblems"):
        story += [_section_head("PRACTICE PROBLEMS"), Spacer(1, 9)]

        for i, prob in enumerate(data["practiceProblems"], 1):
            story.append(KeepTogether([
                _problem_card(
                    i,
                    prob.get("difficulty", "easy"),
                    prob.get("statement", ""),
                ),
                Spacer(1, 6),
            ]))

    doc.build(story)
    return buf.getvalue()
