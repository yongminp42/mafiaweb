from pathlib import Path
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor


ROOT = Path(r"C:\workspace-sts-5.3.0\mafiagame")
OUT = ROOT / "MAFIAGAME_프로젝트_입문_강의서.docx"

NAVY = "202A44"
CORAL = "D9534F"
MINT = "2E9D83"
LIGHT_BLUE = "EAF1F8"
LIGHT_GRAY = "F4F5F7"
MID_GRAY = "D9D9D9"
INK = "171B23"
MUTED = "5F6876"
BODY_FONT = "Noto Sans KR"
HEADING_FONT = "Gulim"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_borders(cell, color=MID_GRAY, size="6"):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = "w:" + edge
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), size)
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)


def set_cell_margins(cell, top=100, start=130, bottom=100, end=130):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for side, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn("w:" + side))
        if node is None:
            node = OxmlElement("w:" + side)
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_cant_split(row):
    tr_pr = row._tr.get_or_add_trPr()
    if tr_pr.find(qn("w:cantSplit")) is None:
        tr_pr.append(OxmlElement("w:cantSplit"))


def set_width(cell, width_cm):
    cell.width = Cm(width_cm)
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_w = tc_pr.find(qn("w:tcW"))
    if tc_w is None:
        tc_w = OxmlElement("w:tcW")
        tc_pr.append(tc_w)
    tc_w.set(qn("w:w"), str(int(width_cm * 567)))
    tc_w.set(qn("w:type"), "dxa")


def set_run_font(run, name=BODY_FONT, size=None, bold=None, color=None, italic=None):
    run.font.name = name
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), name)
    if size is not None:
        run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    if color is not None:
        run.font.color.rgb = RGBColor.from_string(color)
    if italic is not None:
        run.italic = italic


def set_para_spacing(paragraph, before=0, after=7, line=1.35):
    fmt = paragraph.paragraph_format
    fmt.space_before = Pt(before)
    fmt.space_after = Pt(after)
    fmt.line_spacing = line


def add_field(paragraph, field_code):
    run = paragraph.add_run()
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = field_code
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "end")
    run._r.append(fld_char1)
    run._r.append(instr_text)
    run._r.append(fld_char2)
    set_run_font(run, size=8, color=MUTED)


def add_page_number_footer(section):
    footer = section.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_para_spacing(p, after=0, line=1.0)
    r = p.add_run("MAFIAGAME 프로젝트 입문 강의서  |  ")
    set_run_font(r, size=8, color=MUTED)
    add_field(p, "PAGE")


def style_document(doc):
    section = doc.sections[0]
    section.top_margin = Cm(1.85)
    section.bottom_margin = Cm(1.7)
    section.left_margin = Cm(2.05)
    section.right_margin = Cm(2.05)
    section.header_distance = Cm(0.8)
    section.footer_distance = Cm(0.8)
    add_page_number_footer(section)

    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = BODY_FONT
    normal._element.rPr.rFonts.set(qn("w:ascii"), BODY_FONT)
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), BODY_FONT)
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), BODY_FONT)
    normal.font.size = Pt(10.4)
    normal.font.color.rgb = RGBColor.from_string(INK)
    normal.paragraph_format.space_after = Pt(7)
    normal.paragraph_format.line_spacing = 1.35

    for name, size, color, before, after in [
        ("Title", 27, INK, 0, 16),
        ("Heading 1", 19, INK, 16, 9),
        ("Heading 2", 14, INK, 12, 6),
        ("Heading 3", 11.5, INK, 9, 4),
    ]:
        style = styles[name]
        style.font.name = HEADING_FONT
        style._element.rPr.rFonts.set(qn("w:ascii"), HEADING_FONT)
        style._element.rPr.rFonts.set(qn("w:hAnsi"), HEADING_FONT)
        style._element.rPr.rFonts.set(qn("w:eastAsia"), HEADING_FONT)
        style.font.size = Pt(size)
        style.font.bold = False
        style.font.color.rgb = RGBColor.from_string(color)
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.line_spacing = 1.15
        style.paragraph_format.keep_with_next = True
        p_borders = style._element.pPr.find(qn("w:pBdr")) if style._element.pPr is not None else None
        if p_borders is not None:
            style._element.pPr.remove(p_borders)
        r_pr = style._element.rPr
        for tag in ("w:bCs", "w:szCs"):
            node = r_pr.find(qn(tag)) if r_pr is not None else None
            if node is not None:
                r_pr.remove(node)

    if "Code" not in styles:
        code_style = styles.add_style("Code", WD_STYLE_TYPE.PARAGRAPH)
    else:
        code_style = styles["Code"]
    code_style.font.name = "Consolas"
    code_style._element.rPr.rFonts.set(qn("w:ascii"), "Consolas")
    code_style._element.rPr.rFonts.set(qn("w:hAnsi"), "Consolas")
    code_style._element.rPr.rFonts.set(qn("w:eastAsia"), BODY_FONT)
    code_style.font.size = Pt(8.6)
    code_style.font.color.rgb = RGBColor.from_string("334155")
    code_style.paragraph_format.left_indent = Cm(0.35)
    code_style.paragraph_format.right_indent = Cm(0.35)
    code_style.paragraph_format.space_before = Pt(2)
    code_style.paragraph_format.space_after = Pt(2)
    code_style.paragraph_format.line_spacing = 1.15


def add_title(doc, title, subtitle=None):
    p = doc.add_paragraph(style="Title")
    p_borders = p._p.get_or_add_pPr().find(qn("w:pBdr"))
    if p_borders is not None:
        p._p.get_or_add_pPr().remove(p_borders)
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run(title)
    set_run_font(r, size=27, bold=True, color=INK)
    if subtitle:
        p2 = doc.add_paragraph()
        set_para_spacing(p2, after=15, line=1.2)
        r2 = p2.add_run(subtitle)
        set_run_font(r2, size=13, color=MUTED)


def add_body(doc, text, bold_lead=None):
    p = doc.add_paragraph()
    set_para_spacing(p)
    if bold_lead and text.startswith(bold_lead):
        r1 = p.add_run(bold_lead)
        set_run_font(r1, bold=True, color=INK)
        r2 = p.add_run(text[len(bold_lead):])
        set_run_font(r2, color=INK)
    else:
        r = p.add_run(text)
        set_run_font(r, color=INK)
    return p


def add_small(doc, text, color=MUTED):
    p = doc.add_paragraph()
    set_para_spacing(p, after=5, line=1.2)
    r = p.add_run(text)
    set_run_font(r, size=9, color=color)
    return p


def add_bullets(doc, items, level=0):
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.left_indent = Cm(0.55 + level * 0.45)
        p.paragraph_format.first_line_indent = Cm(-0.25)
        set_para_spacing(p, after=4, line=1.3)
        if isinstance(item, tuple):
            lead, rest = item
            r1 = p.add_run(lead)
            set_run_font(r1, bold=True, color=INK)
            r2 = p.add_run(rest)
            set_run_font(r2, color=INK)
        else:
            r = p.add_run(item)
            set_run_font(r, color=INK)


def add_code(doc, lines, label=None):
    if label:
        p = doc.add_paragraph()
        set_para_spacing(p, before=4, after=3, line=1.0)
        r = p.add_run(label)
        set_run_font(r, size=9, bold=True, color=MUTED)
    for line in lines.split("\n"):
        p = doc.add_paragraph(style="Code")
        r = p.add_run(line if line else " ")
        set_run_font(r, name="Consolas", size=8.6, color="334155")


def add_table(doc, headers, rows, widths=None, header_fill=NAVY, font_size=8.8):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    header = table.rows[0]
    set_repeat_table_header(header)
    set_cant_split(header)
    for i, text in enumerate(headers):
        cell = header.cells[i]
        if widths:
            set_width(cell, widths[i])
        set_cell_shading(cell, header_fill)
        set_cell_borders(cell)
        set_cell_margins(cell)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        set_para_spacing(p, after=0, line=1.15)
        r = p.add_run(str(text))
        set_run_font(r, size=font_size, bold=True, color="FFFFFF")
    for ri, row in enumerate(rows):
        row_obj = table.add_row()
        set_cant_split(row_obj)
        cells = row_obj.cells
        for ci, value in enumerate(row):
            cell = cells[ci]
            if widths:
                set_width(cell, widths[ci])
            if ri % 2 == 1:
                set_cell_shading(cell, LIGHT_GRAY)
            set_cell_borders(cell)
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            p = cell.paragraphs[0]
            set_para_spacing(p, after=0, line=1.2)
            r = p.add_run(str(value))
            set_run_font(r, size=font_size, color=INK)
    spacer = doc.add_paragraph()
    set_para_spacing(spacer, after=2, line=1.0)
    return table


def add_flow_table(doc, stages):
    table = doc.add_table(rows=1, cols=len(stages))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_repeat_table_header(table.rows[0])
    set_cant_split(table.rows[0])
    for i, stage in enumerate(stages):
        cell = table.rows[0].cells[i]
        set_width(cell, 3.0)
        set_cell_borders(cell, color="C7D3E0")
        set_cell_margins(cell, top=140, start=110, bottom=140, end=110)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        set_cell_shading(cell, LIGHT_BLUE if i % 2 == 0 else "F8FAFC")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_para_spacing(p, after=0, line=1.15)
        r = p.add_run(stage)
        set_run_font(r, size=9, bold=True, color=NAVY)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_para_spacing(p, before=0, after=7, line=1.0)
    r = p.add_run("  ->  ".join(["브라우저", "컨트롤러", "서비스", "매퍼", "DB"]))
    set_run_font(r, size=8.5, color=MUTED)


def page_break(doc):
    # Chapter headings use keep_with_next; letting Word paginate naturally avoids
    # nearly empty pages when the previous section already fills a page.
    return None


def h1(doc, text):
    return doc.add_heading(text, level=1)


def h2(doc, text):
    return doc.add_heading(text, level=2)


def h3(doc, text):
    return doc.add_heading(text, level=3)


def add_path_list(doc, title, paths):
    h2(doc, title)
    for path, description in paths:
        p = doc.add_paragraph()
        set_para_spacing(p, after=4, line=1.25)
        r1 = p.add_run(path)
        set_run_font(r1, name="Consolas", size=8.9, bold=True, color=NAVY)
        r2 = p.add_run("  " + description)
        set_run_font(r2, size=9.5, color=INK)


def main():
    doc = Document()
    style_document(doc)

    # Cover
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Cm(2.0)
    p.paragraph_format.space_after = Cm(1.0)
    r = p.add_run("MAFIAGAME")
    set_run_font(r, size=12, bold=True, color=CORAL)

    add_title(doc, "MAFIAGAME 프로젝트 입문 강의서", "현재 코드 기준 구조와 데이터 흐름")
    add_body(doc, "이 문서는 Spring Boot를 처음 보는 사람이 현재 프로젝트의 실행 구조를 따라가며 학습할 수 있도록 만든 강의형 안내서입니다. 로그인과 회원가입부터 방 목록, 방 생성, 대기실, 실시간 채팅과 참가자 준비 상태까지 한 사용자의 행동이 어떤 코드와 데이터베이스를 거치는지 순서대로 설명합니다.")
    add_body(doc, "핵심 결론은 간단합니다. 이 프로젝트는 브라우저가 요청을 보내면 Controller가 입구가 되고, Service가 규칙을 판단하며, MyBatis Mapper가 데이터베이스를 읽고 쓰는 MVC 구조를 기본으로 합니다. 대기실에서 계속 바뀌는 참가자와 준비 상태는 DB가 아니라 서버 메모리와 WebSocket으로 전달됩니다.")
    add_small(doc, "분석 기준: C:\\workspace-sts-5.3.0\\mafiagame  |  기준일: 2026년 9월 16일")
    add_table(doc, ["대상 독자", "이 문서에서 얻는 것"], [
        ("Java와 웹 개발이 처음인 사람", "프로젝트를 실행하고 요청이 서버를 통과하는 길을 이해합니다."),
        ("Spring MVC를 배우는 사람", "Controller, Service, Mapper, Domain, DTO의 역할을 구분합니다."),
        ("현재 프로젝트를 이어받는 개발자", "구현된 범위와 아직 게임 로직으로 확장해야 할 경계를 빠르게 파악합니다."),
    ], widths=[4.1, 12.7], font_size=9.2)
    add_small(doc, "읽는 순서: 1장부터 4장까지는 웹과 Spring의 기초, 5장부터 8장까지는 이 프로젝트의 실제 흐름, 9장 이후는 파일 지도와 다음 학습 과제입니다.")

    doc.add_page_break()
    h1(doc, "1. 먼저 알아야 할 전체 그림")
    add_body(doc, "코드를 처음 볼 때 모든 파일을 한 줄씩 읽으려고 하면 오히려 구조가 흐려집니다. 먼저 사용자의 행동을 하나의 긴 흐름으로 보고, 그다음 각 단계의 담당 파일을 찾는 방식이 가장 빠릅니다.")
    h2(doc, "1.1 사용자가 보는 서비스 흐름")
    add_flow_table(doc, ["브라우저 화면", "HTTP Controller", "Service 규칙", "MyBatis Mapper", "MariaDB"])
    add_bullets(doc, [
        ("회원가입:", "회원가입 화면에서 입력한 값이 /signup POST 요청으로 서버에 들어갑니다."),
        ("로그인:", "Spring Security가 로그인 요청을 가로채고 이메일로 사용자를 찾은 뒤 세션을 만듭니다."),
        ("로비:", "RoomController가 RoomService를 호출하고, RoomMapper의 SQL이 방 목록과 인원 수를 조회합니다."),
        ("대기실:", "초기 화면은 Thymeleaf가 만들고, 이후 참가자와 준비 상태는 WebSocket/STOMP 메시지가 갱신합니다."),
        ("채팅:", "브라우저가 /ws WebSocket으로 연결한 뒤 STOMP SEND를 보내면 서버가 같은 방의 topic으로 다시 방송합니다."),
    ])
    h2(doc, "1.2 폴더 구조를 읽는 법")
    add_code(doc, "src/main/java/kr/or/oti/mafiagame/\n  MafiagameApplication.java       애플리케이션 시작점\n  config/                         Security와 WebSocket 설정\n  controller/                    HTTP와 WebSocket 메시지 입구\n  service/                       검증, 업무 규칙, 실시간 상태 관리\n  dao/                           MyBatis Mapper 인터페이스\n  domain/                        DB와 가까운 객체\n  dto/                           메시지와 화면 전달용 객체\n  security/                      로그인 사용자 표현\n  exception/                     WebSocket 오류 타입\n\nsrc/main/resources/\n  templates/                     Thymeleaf HTML\n  static/css/                    화면 스타일\n  static/js/                     브라우저 동작과 WebSocket 코드\n  mappers/                       실제 SQL이 들어 있는 XML\n  application.properties         DB와 MyBatis 설정")
    add_body(doc, "README.md의 예시 구조 설명은 현재 실제 폴더 이름과 일부 다릅니다. 현재 소스에서 기준이 되는 구조는 controller, service, dao, domain, dto, config, security입니다. 학습할 때는 문서의 설명보다 실제 파일 트리를 우선 확인하세요.")
    h2(doc, "1.3 이 프로젝트의 구현 범위")
    add_table(doc, ["현재 구현됨", "아직 구현되지 않음"], [
        ("회원가입, BCrypt 비밀번호 저장, 이메일 로그인", "방 입장 시 비밀번호 검증과 DB 참가 등록"),
        ("DB 기반 방 목록과 방 생성", "게임 시작, 직업 배정, 낮과 밤, 투표, 승패 판정"),
        ("WebSocket 채팅과 실시간 접속자/준비 상태", "게임 진행용 WebSocket 메시지와 페이즈 권한"),
        ("Thymeleaf 화면과 기본 반응형 CSS", "실제 사용자 전적, 친구, 업적 데이터 연동"),
    ], widths=[8.4, 8.4], font_size=9.0)

    page_break(doc)
    h1(doc, "2. Spring Boot가 애플리케이션을 시작하는 과정")
    add_body(doc, "Spring Boot 애플리케이션은 main 메서드에서 시작하지만, 실제로 많은 일을 Spring이 대신 준비합니다. @SpringBootApplication이 붙은 클래스가 기준 패키지를 정하고, Spring은 그 아래의 @Controller, @Service, @Configuration, @Mapper를 찾아 객체를 생성합니다.")
    h2(doc, "2.1 시작점")
    add_code(doc, "@SpringBootApplication\n@MapperScan(\"kr.or.oti.mafiagame\")\npublic class MafiagameApplication {\n    public static void main(String[] args) {\n        SpringApplication.run(MafiagameApplication.class, args);\n    }\n}", "파일: src/main/java/kr/or/oti/mafiagame/MafiagameApplication.java")
    add_bullets(doc, [
        ("@SpringBootApplication:", "자동 설정, 컴포넌트 스캔, 설정 클래스 검색을 한 번에 활성화합니다."),
        ("@MapperScan:", "MyBatis Mapper 인터페이스를 Spring Bean처럼 주입할 수 있게 검색합니다."),
        ("SpringApplication.run:", "내장 서버, MVC, Security, MyBatis, WebSocket에 필요한 객체를 조립합니다."),
    ])
    h2(doc, "2.2 의존성은 무엇을 제공하는가")
    add_table(doc, ["build.gradle 의존성", "프로젝트에서 사용하는 기능"], [
        ("spring-boot-starter-web", "Spring MVC, 내장 서버, HTTP 요청 처리"),
        ("spring-boot-starter-thymeleaf", "서버에서 HTML에 데이터를 넣어 렌더링"),
        ("spring-boot-starter-security", "로그인, 세션, 접근 권한, 비밀번호 인증"),
        ("mybatis-spring-boot-starter", "Java Mapper와 XML SQL 연결"),
        ("spring-boot-starter-websocket", "WebSocket과 STOMP 메시지 브로커"),
        ("mariadb-java-client", "MariaDB JDBC 연결"),
        ("lombok", "Getter, Setter, Builder 등 반복 코드 생성"),
    ], widths=[6.3, 10.5], font_size=8.9)
    h2(doc, "2.3 application.properties 읽기")
    add_code(doc, "spring.datasource.url=jdbc:mariadb://localhost:23306/mafiaweb\nspring.datasource.username=${DB_USERNAME:root}\nspring.datasource.password=${DB_PASSWORD:}\nmybatis.mapper-locations=classpath:/mappers/**/*.xml\nmybatis.configuration.map-underscore-to-camel-case=true", "파일: src/main/resources/application.properties")
    add_body(doc, "${DB_USERNAME:root}처럼 쓰인 표현은 환경 변수 DB_USERNAME이 있으면 그 값을 쓰고, 없으면 root를 사용한다는 의미입니다. 비밀번호는 기본값이 빈 값입니다. 실제 개발 환경에서는 계정 정보를 소스에 직접 적기보다 환경 변수나 별도 비밀 저장소를 사용합니다.")
    add_body(doc, "map-underscore-to-camel-case=true는 SQL 결과의 current_players를 Java 프로퍼티 currentPlayers로 연결하는 데 도움을 줍니다. 다만 User 클래스의 user_level처럼 Java 필드 자체가 언더스코어 이름이면, 다른 필드와 명명 방식이 섞이므로 유지보수 때 주의해야 합니다.")

    page_break(doc)
    h1(doc, "3. MVC를 실제 코드로 이해하기")
    add_body(doc, "MVC는 파일을 세 종류로 나누는 규칙이 아니라, 책임을 나누는 사고방식입니다. 사용자의 요청을 받는 곳, 규칙을 판단하는 곳, 데이터를 저장하는 곳을 분리하면 코드가 커져도 어느 부분을 수정해야 하는지 찾기 쉬워집니다.")
    add_table(doc, ["역할", "이 프로젝트의 위치", "쉽게 말하면"], [
        ("Controller", "controller/*.java", "주소와 메시지의 입구. 화면 이름이나 응답을 결정합니다."),
        ("Service", "service/*.java", "회원가입 검증, 방 생성, 실시간 상태 같은 업무 규칙을 수행합니다."),
        ("Mapper", "dao/*.java + resources/mappers/*.xml", "Java 메서드와 SQL을 연결합니다."),
        ("Domain", "domain/*.java", "DB에서 읽고 쓰는 데이터 구조를 표현합니다."),
        ("DTO", "dto/*.java", "채팅, 준비 상태 등 특정 메시지의 입력과 출력 모양을 정의합니다."),
        ("Template", "templates/**/*.html", "서버가 전달한 Model을 화면으로 바꿉니다."),
    ], widths=[3.1, 6.0, 7.7], font_size=8.8)
    h2(doc, "3.1 Controller는 얇게 유지된다")
    add_code(doc, "@GetMapping({\"/\", \"/rooms\"})\npublic String roomList(Model model) {\n    model.addAttribute(\"rooms\", roomService.getRooms());\n    return \"rooms/list\";\n}", "파일: controller/RoomController.java")
    add_body(doc, "위 메서드가 하는 일은 세 가지입니다. URL을 매핑하고, Service를 호출하고, 결과를 Model에 넣은 뒤 rooms/list라는 Thymeleaf 템플릿을 반환합니다. SQL이나 비밀번호 규칙을 Controller 안에 넣지 않는 것이 이 구조의 중요한 약속입니다.")
    h2(doc, "3.2 Service는 규칙을 모으는 곳이다")
    add_body(doc, "RoomService.createRoom은 제목 길이, 인원 수, 비밀번호 길이를 확인하고, 비밀번호를 BCrypt로 해시한 Room 객체를 만든 다음 두 개의 INSERT를 하나의 트랜잭션 안에서 실행합니다. SignupService.signup도 입력 정규화와 검증, 이메일 중복 확인, 비밀번호 해시, 사용자 INSERT를 담당합니다.")
    h2(doc, "3.3 Mapper는 SQL을 숨긴다")
    add_body(doc, "Controller와 Service는 SELECT 문을 직접 알지 않습니다. RoomMapper.findAll 같은 메서드를 호출하고, 실제 SQL은 RoomMapper.xml에 있습니다. 그래서 DB 컬럼이나 JOIN을 바꿀 때는 Mapper XML과 결과 객체의 연결을 함께 확인하면 됩니다.")
    add_table(doc, ["호출", "SQL", "결과"], [
        ("UserMapper.findByEmail", "email로 user 조회", "Optional<User>"),
        ("RoomMapper.findAll", "game_room과 user, room_members JOIN 및 COUNT", "List<RoomList>"),
        ("RoomMapper.findById", "특정 방 한 개와 현재 DB 인원 수 조회", "RoomList"),
        ("RoomMapper.insert", "game_room INSERT 및 생성된 roomId 수신", "Room"),
        ("RoomMapper.insertMember", "방장과 방의 관계 INSERT", "영향받은 행 수"),
    ], widths=[5.0, 7.0, 4.8], font_size=8.8)

    page_break(doc)
    h1(doc, "4. 회원가입과 로그인 흐름")
    add_body(doc, "인증은 두 단계를 구분해서 이해해야 합니다. 회원가입은 사용자를 DB에 만드는 과정이고, 로그인은 이미 있는 사용자를 찾아 현재 브라우저를 인증된 상태로 바꾸는 과정입니다.")
    h2(doc, "4.1 회원가입 화면에서 DB까지")
    add_flow_table(doc, ["signup.html", "AuthController", "SignupService", "UserMapper", "user 테이블"])
    add_code(doc, "POST /signup\nfields: nickname, email, password, passwordConfirm, agreement\n성공: redirect:/login?signup\n실패: auth/signup + signupError + 입력값 일부 복원", "파일: controller/AuthController.java")
    add_bullets(doc, [
        ("정규화:", "닉네임과 이메일의 앞뒤 공백을 제거하고 이메일은 소문자로 바꿉니다."),
        ("검증:", "닉네임 2~30자, 이메일 형식, 비밀번호 8자 이상 및 UTF-8 72바이트 이하, 확인 값 일치, 약관 동의를 확인합니다."),
        ("중복 방지:", "UserMapper.existsByEmail로 먼저 확인하고, DB UNIQUE 제약 위반도 DataIntegrityViolationException으로 다시 처리합니다."),
        ("보안 저장:", "원문 비밀번호를 저장하지 않고 PasswordEncoder, 즉 BCryptPasswordEncoder로 해시합니다."),
    ])
    h2(doc, "4.2 로그인은 Spring Security가 가로챈다")
    add_code(doc, "form action=/login method=post\nusernameParameter = email\npasswordParameter = password\n성공 후 이동 = /rooms\n실패 후 이동 = /login?error", "화면: templates/auth/login.html  |  설정: config/SecurityConfig.java")
    add_body(doc, "로그인 폼은 AuthController의 POST 메서드로 가지 않습니다. SecurityConfig가 loginProcessingUrl('/login')을 등록했기 때문에 Spring Security 필터가 요청을 먼저 처리합니다. 이때 email 필드가 usernameParameter로 지정되어 있어, Security가 UserDetailsService.loadUserByUsername(email)을 호출합니다.")
    add_code(doc, "String normalizedEmail = email == null ? \"\" : email.trim().toLowerCase(Locale.ROOT);\nreturn userMapper.findByEmail(normalizedEmail)\n        .map(CustomUserDetails::new)\n        .orElseThrow(...);", "파일: service/CustomUserDetailsService.java")
    add_body(doc, "CustomUserDetails는 Spring Security의 User를 상속합니다. 기본 인증 정보에는 이메일과 해시된 비밀번호가 들어가고, 프로젝트가 화면과 실시간 메시지에서 필요로 하는 userId와 nickname을 추가로 보관합니다. 그래서 Thymeleaf에서는 principal.nickname, 서버에서는 @AuthenticationPrincipal CustomUserDetails를 사용할 수 있습니다.")
    h2(doc, "4.3 접근 권한 규칙")
    add_table(doc, ["경로", "현재 권한", "이유"], [
        ("/ , /rooms , /login , /signup", "비로그인 허용", "로비와 인증 화면은 누구나 볼 수 있습니다."),
        ("/css/** , /js/** , /error", "비로그인 허용", "정적 리소스와 오류 페이지입니다."),
        ("/ws/**", "로그인 필요", "WebSocket 연결도 인증 사용자를 대상으로 합니다."),
        ("그 외 모든 요청", "로그인 필요", "방 생성과 방 상세 등은 인증된 사용자만 접근합니다."),
    ], widths=[5.2, 4.2, 7.4], font_size=8.8)

    page_break(doc)
    h1(doc, "5. 로비에서 방을 만들기까지")
    add_body(doc, "로비는 DB에 저장된 방 목록을 서버에서 HTML로 그립니다. 검색과 상태 필터는 서버 재조회가 아니라 브라우저의 작은 JavaScript가 이미 받은 카드들을 숨기고 보여 주는 방식입니다.")
    h2(doc, "5.1 방 목록 조회")
    add_code(doc, "GET / 또는 GET /rooms\n  RoomController.roomList\n    -> RoomService.getRooms\n      -> RoomMapper.findAll\n        -> RoomMapper.xml SELECT\n          -> RoomList 목록\n  Model.rooms -> templates/rooms/list.html", "실제 호출 흐름")
    add_body(doc, "RoomMapper.findAll은 game_room을 중심으로 방장 사용자와 room_members를 JOIN합니다. COUNT(rm.user_id)로 DB에 등록된 참가자 수를 세고, 비밀번호가 있으면 locked=true로 계산합니다. 대기 중 방을 먼저 정렬하고, 같은 상태 안에서는 생성 시간이 최근인 방을 위로 올립니다.")
    h2(doc, "5.2 방 생성 입력과 서버 검증")
    add_code(doc, "POST /rooms\n입력: title, maxPlayers, password\n인증 사용자: CustomUserDetails user\n성공: redirect:/rooms/{roomId}\n실패: rooms/create + roomError", "파일: controller/RoomController.java")
    add_table(doc, ["입력", "서버 규칙", "DB에 저장되는 형태"], [
        ("title", "2자 이상 100자 이하", "앞뒤 공백 제거 후 game_room.title"),
        ("maxPlayers", "4 이상 8 이하", "game_room.max_players"),
        ("password", "없거나 4~20자", "있으면 BCrypt 해시, 없으면 NULL"),
        ("hostUserId", "현재 로그인 사용자 ID", "game_room.host_user_id 및 room_members"),
        ("status", "서비스가 WAITING으로 지정", "game_room.status"),
    ], widths=[3.4, 6.1, 7.3], font_size=8.8)
    add_body(doc, "방 생성은 game_room INSERT 후 방장 자신을 room_members에 INSERT합니다. 두 작업 중 하나라도 실패하면 @Transactional에 의해 함께 롤백되는 것이 의도입니다. 방장은 DB에 등록되지만, 다른 사용자의 입장 처리 API는 현재 아직 구현되지 않았습니다.")
    h2(doc, "5.3 화면과 실제 기능의 차이")
    add_bullets(doc, [
        ("비밀번호 토글:", "create.html의 JavaScript가 비밀번호 필드를 활성화하거나 비활성화합니다. 최종 검증은 RoomService가 합니다."),
        ("방 입장 버튼:", "list.html에서 /rooms/{id}로 이동하지만, RoomController는 현재 방 상세 화면을 보여 주는 단계입니다."),
        ("관전하기 문구:", "status가 PLAYING이면 관전하기라고 표시하지만, 실제 관전 권한이나 관전 데이터 흐름은 아직 없습니다."),
        ("현재 접속자 128명:", "화면에 고정된 표시값이며 실제 접속자 수를 계산하는 기능이 아닙니다."),
    ])

    page_break(doc)
    h1(doc, "6. 데이터베이스와 MyBatis 흐름")
    add_body(doc, "DB 스키마를 먼저 보면 Java 객체의 의미가 선명해집니다. 현재 스키마는 사용자, 사용자 전적, 게임방, 방 참가 관계를 분리한 관계형 구조입니다.")
    h2(doc, "6.1 테이블 관계")
    add_table(doc, ["테이블", "핵심 컬럼", "현재 사용 방식"], [
        ("user", "user_id, user_name, email, password", "회원가입과 로그인 사용자 조회"),
        ("user_stats", "user_id, total_games, wins, rating", "스키마는 있으나 현재 Controller는 사용하지 않음"),
        ("game_room", "room_id, host_user_id, title, max_players, status", "방 생성과 방 목록/상세 조회"),
        ("room_members", "room_id, user_id, is_ready, role, is_alive", "방장 등록과 DB 인원 수 계산. 준비/역할 업데이트는 미구현"),
    ], widths=[3.2, 6.2, 7.4], font_size=8.8)
    add_code(doc, "user 1 --- N game_room (host_user_id)\nuser 1 --- N room_members N --- 1 game_room\nuser 1 --- 1 user_stats", "개념 관계")
    h2(doc, "6.2 Domain과 RoomList를 나누는 이유")
    add_body(doc, "Room은 방을 INSERT할 때 필요한 값에 가깝습니다. 반면 RoomList는 방 목록에 보여 줄 hostName, currentPlayers, locked까지 포함합니다. 즉 하나는 저장 모델이고 다른 하나는 조회 결과 모델입니다. SQL JOIN과 COUNT의 결과를 Room에 억지로 넣지 않고 RoomList로 분리한 점이 핵심입니다.")
    add_table(doc, ["객체", "대표 필드", "사용 위치"], [
        ("User", "userId, userName, email, password", "회원가입 INSERT, 로그인 조회"),
        ("Room", "hostUserId, title, roomPassword, maxPlayers, status", "방 생성 INSERT"),
        ("RoomList", "title, hostName, currentPlayers, locked", "로비와 방 상세 화면"),
        ("RoomParticipant", "userId, nickname, host, ready", "WebSocket 실시간 상태"),
    ], widths=[4.0, 7.1, 5.7], font_size=8.8)
    h2(doc, "6.3 MyBatis XML을 읽는 순서")
    add_bullets(doc, [
        ("namespace:", "XML이 어떤 Mapper 인터페이스에 연결되는지 확인합니다."),
        ("id:", "Java 인터페이스 메서드 이름과 같은지 확인합니다."),
        ("resultType 또는 resultMap:", "SQL 결과를 어떤 Java 객체에 넣는지 확인합니다."),
        ("#{parameter}:", "메서드 파라미터를 안전하게 바인딩하는 자리입니다."),
        ("useGeneratedKeys:", "INSERT 뒤 DB가 만든 AUTO_INCREMENT 키를 객체에 다시 넣습니다."),
    ])
    add_body(doc, "UserMapper.xml은 User의 user_id를 userId, user_name을 userName으로 명시적으로 매핑합니다. RoomMapper.xml은 SQL 별칭과 map-underscore-to-camel-case 설정을 함께 사용해 current_players를 currentPlayers로 연결합니다.")

    page_break(doc)
    h1(doc, "7. 방 상세 화면과 두 종류의 상태")
    add_body(doc, "방 상세 화면을 이해할 때는 DB 상태와 실시간 접속 상태를 분리해서 보아야 합니다. 화면의 제목, 방장, 최대 인원은 DB에서 읽고, 지금 이 브라우저 세션이 연결되어 있는지와 준비 여부는 WebSocket 서버 메모리에서 관리합니다.")
    h2(doc, "7.1 HTTP로 초기 화면을 그리는 과정")
    add_code(doc, "GET /rooms/{roomId}\n  RoomController.roomDetail\n    -> roomService.getRoom(roomId)\n    -> roomService.getMemberNames(roomId)\n    -> Model(roomId, nickname, userId, room, members)\n    -> templates/rooms/detail.html", "초기 페이지 흐름")
    add_body(doc, "detail.html의 body에는 data-room-id, data-nickname, data-user-id, data-capacity가 들어갑니다. chat.js는 이 값을 읽어 어느 방에 연결할지, 현재 사용자를 누구로 표시할지, 빈 자리를 몇 개 만들지 결정합니다.")
    h2(doc, "7.2 존재하지 않는 방에 대한 현재 처리")
    add_body(doc, "roomDetail에서 roomService.getRoom(roomId)가 null이면 오류 페이지 대신 Moonlight Mafia라는 예시 방과 예시 참가자 목록을 넣어 화면을 보여 줍니다. 이것은 화면 데모에는 도움이 되지만, 같은 roomId로 WebSocket join이나 chat을 시도하면 RoomPresenceService와 ChatController가 존재하지 않는 게임방이라고 거절합니다. 실제 서비스에서는 404 또는 사용자에게 명확한 안내 화면을 반환하는 방향이 더 자연스럽습니다.")
    h2(doc, "7.3 RoomPresenceService의 메모리 자료구조")
    add_code(doc, "participantsByRoom\n  roomId -> sessionId -> RoomParticipant\n\nroomBySession\n  sessionId -> roomId\n\nmonitor\n  두 Map을 동시에 바꿀 때 사용하는 synchronized 기준", "파일: service/RoomPresenceService.java")
    add_body(doc, "participantsByRoom은 같은 방에 연결된 WebSocket 세션들을 모읍니다. roomBySession은 세션이 어느 방에 속해 있는지 빠르게 찾기 위한 역방향 인덱스입니다. 두 Map을 함께 수정해야 하므로 monitor 객체를 기준으로 synchronized 블록을 사용합니다.")
    h2(doc, "7.4 참여, 준비, 나가기")
    add_table(doc, ["상황", "검사와 처리", "방 전체에 보내는 결과"], [
        ("join", "세션과 Principal이 있는지, 방이 DB에 존재하는지 확인. 방장 여부 계산", "/topic/rooms/{roomId}/presence"),
        ("ready", "세션이 먼저 해당 방에 join했는지 확인. ready 값만 교체", "새 참가자 목록 전체 방송"),
        ("disconnect", "SessionDisconnectEvent에서 세션 제거", "남아 있는 참가자 목록 방송"),
    ], widths=[3.0, 8.6, 5.2], font_size=8.6)
    add_body(doc, "현재 준비 상태는 room_members.is_ready에 저장되지 않습니다. 브라우저가 연결된 동안만 살아 있는 서버 메모리 값이며, 서버 재시작이나 다른 서버 인스턴스로 이동하면 사라집니다. 이것은 현재 MVP 단계의 단순한 선택이고, 영속적인 게임 상태가 필요해지면 별도 설계가 필요합니다.")

    page_break(doc)
    h1(doc, "8. WebSocket과 STOMP 채팅 흐름")
    add_body(doc, "HTTP는 요청을 보내고 응답을 받는 데 적합하지만, 대기실에서 누군가 준비 버튼을 누를 때마다 모든 브라우저에 즉시 알려 주려면 서버가 먼저 메시지를 보낼 수 있어야 합니다. WebSocket은 연결을 오래 유지하고 양방향으로 데이터를 전달하는 통로입니다. STOMP는 그 통로 위에서 목적지와 메시지 형식을 정하는 약속입니다.")
    h2(doc, "8.1 서버 설정")
    add_code(doc, "registry.enableSimpleBroker(\"/topic\", \"/queue\");\nregistry.setApplicationDestinationPrefixes(\"/app\");\nregistry.setUserDestinationPrefix(\"/user\");\nregistry.addEndpoint(\"/ws\");", "파일: config/WebSocketConfig.java")
    add_table(doc, ["접두사", "의미", "이 프로젝트 예시"], [
        ("/app", "브라우저가 서버로 보내는 목적지", "/app/rooms/1/chat"),
        ("/topic", "방 전체가 구독하는 방송 목적지", "/topic/rooms/1/chat"),
        ("/user", "특정 로그인 사용자에게 보내는 목적지", "/user/queue/errors"),
        ("/queue", "개인 응답에 자주 쓰는 broker 경로", "errors와 함께 사용"),
    ], widths=[3.0, 7.3, 6.5], font_size=8.8)
    h2(doc, "8.2 브라우저의 연결 순서")
    add_code(doc, "1. new WebSocket('ws(s)://현재호스트/ws')\n2. CONNECT frame 전송\n3. CONNECTED 수신\n4. presence, chat, errors SUBSCRIBE\n5. /app/rooms/{roomId}/join SEND\n6. 사용자가 채팅 또는 준비 상태 SEND\n7. beforeunload 때 DISCONNECT", "파일: static/js/chat.js")
    add_body(doc, "이 프로젝트는 STOMP 전용 JavaScript 라이브러리를 사용하지 않고 chat.js에서 frame을 직접 만들고 해석합니다. createFrame은 command, headers, body, 널 문자로 하나의 프레임을 만들고, parseFrame과 consumeFrames는 서버에서 온 여러 프레임을 분리해 처리합니다. 라이브러리 없이 프로토콜을 직접 보여 준다는 교육적 장점이 있지만, 기능이 늘면 표준 클라이언트 라이브러리 사용을 검토할 수 있습니다.")
    h2(doc, "8.3 채팅 메시지 계약")
    add_table(doc, ["방향", "목적지", "입력 또는 출력", "서버 처리"], [
        ("브라우저 -> 서버", "/app/rooms/{id}/chat", "ChatMessageRequest { content }", "로그인, 방 존재, 빈 값, 300자 검증"),
        ("서버 -> 방 전체", "/topic/rooms/{id}/chat", "ChatMessage { roomId, type, sender, content, sentAt }", "Instant.now()를 붙여 방송"),
        ("서버 -> 개인", "/user/queue/errors", "ChatError { type, message }", "예외를 해당 사용자에게만 전달"),
    ], widths=[3.5, 5.3, 5.1, 4.0], font_size=8.4)
    add_body(doc, "ChatController는 principal이 없으면 거절하고, content를 strip한 뒤 비어 있거나 300자를 초과하면 RoomWebSocketException을 던집니다. 출력할 때는 sender와 content를 JSON으로 보내고, 브라우저는 appendMessage에서 textContent를 사용해 DOM에 넣습니다. 이 방식은 받은 문자열을 HTML로 해석하지 않으므로 기본적인 XSS 위험을 줄이는 데 도움이 됩니다.")

    page_break(doc)
    h1(doc, "9. 실시간 참가자와 준비 상태의 끝까지 흐름")
    add_body(doc, "채팅과 참가자 목록은 같은 WebSocket 연결을 사용하지만, 목적지와 서버 처리 클래스가 다릅니다. 이 차이를 분리해서 읽으면 WebSocket 코드가 훨씬 덜 복잡해집니다.")
    h2(doc, "9.1 입장 메시지")
    add_code(doc, "브라우저\n  SEND /app/rooms/1/join\n  body: {}\n\nRoomPresenceController.join\n  -> RoomPresenceService.join\n    -> DB에서 방 확인\n    -> Principal에서 userId, nickname 확인\n    -> participantsByRoom에 세션 등록\n    -> RoomPresenceState 생성\n    -> /topic/rooms/1/presence 방송", "실제 처리 순서")
    add_body(doc, "join은 데이터베이스의 room_members에 새 행을 넣지 않습니다. 여기서 말하는 참가자는 ‘현재 WebSocket으로 연결된 브라우저 세션’입니다. 따라서 DB 참가자 수와 실시간 접속자 수가 서로 다를 수 있습니다.")
    h2(doc, "9.2 준비 버튼 메시지")
    add_code(doc, "브라우저\n  SEND /app/rooms/1/ready\n  body: { \"ready\": true }\n\nRoomPresenceController.updateReady\n  -> RoomPresenceService.updateReady\n    -> sessionId가 roomId에 join했는지 확인\n    -> 해당 RoomParticipant의 ready 교체\n    -> 전체 참가자 목록 재방송", "실제 처리 순서")
    add_body(doc, "브라우저는 처음부터 준비 버튼을 활성화하지 않습니다. presence 메시지를 받아 현재 사용자 자신의 participant를 찾았을 때 presenceReady=true로 만들고, 연결 상태도 온라인일 때만 버튼을 활성화합니다. 서버가 허용한 상태를 다시 방송하므로 모든 사용자의 화면이 같은 목록으로 수렴합니다.")
    h2(doc, "9.3 나가기와 재연결")
    add_body(doc, "브라우저가 닫히거나 네트워크가 끊기면 WebSocket의 SessionDisconnectEvent가 발생하고, RoomPresenceService.handleDisconnect가 leave를 호출합니다. 브라우저 쪽 close 이벤트는 3초 뒤 connect를 다시 시도합니다. beforeunload에서는 shouldReconnect=false로 바꾸어 정상적으로 페이지를 떠날 때 불필요한 재연결을 막습니다.")
    add_table(doc, ["현재 설계의 장점", "현재 설계의 한계"], [
        ("한 번의 상태 방송으로 모든 브라우저를 갱신", "상태가 서버 메모리에만 있어 서버 재시작 시 사라짐"),
        ("synchronized로 단일 서버 안의 동시 수정 보호", "여러 서버를 띄우면 인스턴스마다 Map이 달라짐"),
        ("세션 ID와 사용자 ID를 함께 식별", "한 사용자가 여러 탭을 열면 세션별 참가자로 보일 수 있음"),
        ("재연결 시 join으로 상태 복원 시도", "실제 방 입장 권한과 재접속 정책은 아직 없음"),
    ], widths=[8.4, 8.4], font_size=8.7)

    page_break(doc)
    h1(doc, "10. 파일별 학습 지도")
    add_body(doc, "아래 표는 코드를 읽을 때 어디서부터 시작할지 알려 주는 지도입니다. 한 번에 모든 CSS까지 분석하지 말고, 먼저 Java 흐름과 템플릿에서 사용하는 Model 이름을 맞춰 보세요.")
    add_path_list(doc, "10.1 시작과 설정", [
        ("MafiagameApplication.java", "Spring Boot 시작점과 Mapper 스캔."),
        ("config/SecurityConfig.java", "공개 URL, 로그인 URL, 로그아웃, 인증 필요 경로."),
        ("config/WebSocketConfig.java", "STOMP broker와 /ws 엔드포인트."),
        ("application.properties", "MariaDB와 MyBatis 연결 설정."),
    ])
    add_path_list(doc, "10.2 HTTP Controller", [
        ("controller/AuthController.java", "로그인/회원가입 화면과 회원가입 POST."),
        ("controller/RoomController.java", "로비, 방 생성, 방 상세 화면."),
        ("controller/UserController.java", "현재는 예시 사용자 프로필 화면."),
    ])
    add_path_list(doc, "10.3 WebSocket Controller", [
        ("controller/ChatController.java", "채팅 입력을 검증하고 방 전체로 방송."),
        ("controller/RoomPresenceController.java", "join과 ready 메시지를 PresenceService로 전달."),
        ("exception/RoomWebSocketException.java", "WebSocket 처리 중 사용자에게 보여 줄 오류."),
    ])
    add_path_list(doc, "10.4 Service와 보안", [
        ("service/SignupService.java", "회원가입 검증, 중복 확인, BCrypt 저장."),
        ("service/CustomUserDetailsService.java", "로그인 시 이메일로 User를 조회."),
        ("service/RoomService.java", "방 조회와 방 생성 검증/트랜잭션."),
        ("service/RoomPresenceService.java", "메모리 기반 접속자와 준비 상태."),
        ("security/CustomUserDetails.java", "Spring Security 사용자에 userId와 nickname 추가."),
    ])
    add_path_list(doc, "10.5 화면과 브라우저", [
        ("templates/auth/*.html", "로그인과 회원가입 화면."),
        ("templates/rooms/list.html", "로비, 검색, 상태 필터."),
        ("templates/rooms/create.html", "방 생성 입력과 비밀번호 토글."),
        ("templates/rooms/detail.html", "대기실과 채팅 UI, data-* 초기값."),
        ("static/js/chat.js", "STOMP frame, 채팅, 참가자 렌더링, 재연결."),
        ("static/css/*.css", "auth, lobby/room, profile 화면 스타일."),
    ])

    page_break(doc)
    h1(doc, "11. 처음부터 따라가는 실습형 시나리오")
    add_body(doc, "이 장은 실제 사용자의 행동을 따라가며 어디에 중단점을 찍고 어떤 값을 확인할지 설명합니다. 코드를 학습할 때는 기능을 읽는 것보다 한 시나리오의 입력과 출력이 어떻게 바뀌는지 추적하는 것이 효과적입니다.")
    h2(doc, "11.1 회원가입")
    add_bullets(doc, [
        "브라우저에서 /signup을 열고 닉네임, 이메일, 비밀번호, 약관을 입력합니다.",
        "POST /signup이 AuthController.signup에 들어오는 것을 확인합니다.",
        "SignupService에서 normalizedEmail, 각 길이 검증, existsByEmail 결과를 확인합니다.",
        "UserMapper.xml의 INSERT가 password가 아니라 BCrypt 문자열을 저장하는지 확인합니다.",
        "성공하면 /login?signup으로 이동하고 로그인 화면에 성공 안내가 표시됩니다.",
    ])
    h2(doc, "11.2 로그인")
    add_bullets(doc, [
        "로그인 폼이 /login으로 POST되지만 AuthController가 아니라 Spring Security가 처리한다는 점을 확인합니다.",
        "CustomUserDetailsService.loadUserByUsername에 이메일이 전달되는지 확인합니다.",
        "CustomUserDetails 안의 getUserId와 getNickname이 방 생성과 화면 표시에서 사용되는지 찾습니다.",
        "성공 후 /rooms로 이동하고, Thymeleaf sec:authentication이 닉네임을 렌더링하는지 봅니다.",
    ])
    h2(doc, "11.3 방 만들기")
    add_bullets(doc, [
        "rooms/create.html의 form field name이 RoomController의 @RequestParam 이름과 같은지 비교합니다.",
        "RoomService.createRoom에서 실패할 수 있는 조건을 일부러 입력해 roomError가 화면에 나타나는지 확인합니다.",
        "성공 시 Room 객체에 생성된 roomId가 채워지고, 방장 room_members INSERT가 뒤따르는지 확인합니다.",
        "redirect:/rooms/{roomId} 뒤 RoomController가 DB의 RoomList와 멤버 이름을 Model에 넣는지 확인합니다.",
    ])
    h2(doc, "11.4 채팅과 준비 상태")
    add_bullets(doc, [
        "detail.html의 body data-* 속성과 chat.js의 roomId, nickname, capacity를 비교합니다.",
        "브라우저 Network에서 /ws 연결 후 CONNECTED, SUBSCRIBE, join SEND 순서를 확인합니다.",
        "서버의 ChatController와 RoomPresenceController 중 어느 쪽이 메시지를 받는지 목적지로 구분합니다.",
        "한 브라우저에서 채팅을 보내고, 다른 브라우저가 /topic/rooms/{id}/chat을 받아 렌더링하는지 확인합니다.",
        "준비 버튼 클릭 후 RoomPresenceService의 Map이 바뀌고 전체 presence가 재방송되는지 확인합니다.",
    ])
    h2(doc, "11.5 학습할 때 기록할 값")
    add_table(doc, ["단계", "관찰할 값", "왜 중요한가"], [
        ("HTTP", "URL, HTTP method, form field name", "어느 Controller 메서드로 들어가는지 결정"),
        ("인증", "Principal, userId, nickname", "화면과 WebSocket에서 현재 사용자를 식별"),
        ("DB", "roomId, user_id, current_players", "영속 데이터와 화면 숫자의 관계 확인"),
        ("STOMP", "destination, body, sessionId", "채팅과 presence 처리 경로를 결정"),
        ("화면", "Model 이름과 th:* 표현식", "서버 값이 HTML에 어떻게 들어가는지 확인"),
    ], widths=[3.2, 7.2, 6.4], font_size=8.8)

    page_break(doc)
    h1(doc, "12. 현재 코드에서 다음으로 배울 내용")
    add_body(doc, "현재 프로젝트는 웹 서비스의 뼈대를 학습하기에 좋은 상태입니다. 다음 단계에서는 화면을 더 만드는 것보다, 이미 있는 방과 참가자 개념을 실제 게임 상태로 확장하는 설계가 중요합니다.")
    h2(doc, "12.1 기능 확장 순서")
    add_table(doc, ["순서", "학습 주제", "구현할 핵심"], [
        ("1", "방 입장과 퇴장", "비밀번호 검증, 정원 확인, room_members INSERT/DELETE, 중복 입장 방지"),
        ("2", "상태 모델", "RoomState, PlayerSession, GamePhase, Role, PlayerStatus 정의"),
        ("3", "게임 시작", "방장 권한, 최소 인원, 전원 준비, WAITING -> 게임 페이즈 전이"),
        ("4", "역할과 개인 메시지", "마피아/경찰/의사/시민 배정과 개인 destination 권한"),
        ("5", "투표와 승패", "1인 1표, 동률 규칙, 동시 집계 보호, 승리 조건"),
        ("6", "영속화와 운영", "게임 기록, 전적, 재접속, 분산 환경, 통합 테스트"),
    ], widths=[2.0, 5.0, 9.8], font_size=8.7)
    h2(doc, "12.2 현재 코드에서 특히 주의할 경계")
    add_bullets(doc, [
        ("방 입장과 WebSocket join은 다릅니다.", "현재 GET /rooms/{roomId}는 화면을 열고, WebSocket join은 실시간 세션을 메모리에 등록합니다. DB 참가 등록까지 이어지지는 않습니다."),
        ("DB 인원 수와 실시간 인원 수는 다를 수 있습니다.", "로비 목록의 currentPlayers는 room_members COUNT이고, 대기실의 숫자는 presence participants.length입니다."),
        ("채팅은 현재 방 참가 여부를 확인하지 않습니다.", "로그인했고 방이 존재하면 메시지를 방송하므로, 실제 서비스에서는 세션의 방 참가 여부와 권한을 추가로 확인해야 합니다."),
        ("fallback 화면은 실제 방을 만들지 않습니다.", "존재하지 않는 roomId에 대한 예시 화면은 WebSocket과 일관되지 않으므로 운영 코드에서는 제거하거나 404 처리로 바꾸는 편이 좋습니다."),
        ("프로필은 아직 샘플 데이터입니다.", "UserController가 userId를 받아도 항상 유진과 고정 전적을 Model에 넣습니다. UserMapper와 user_stats를 연결하는 다음 과제가 필요합니다."),
    ])
    h2(doc, "12.3 테스트를 시작하는 방법")
    add_body(doc, "현재 소스 트리에는 별도의 src/test 코드가 보이지 않습니다. 먼저 순수 규칙부터 테스트하는 것이 좋습니다. 예를 들어 SignupService의 이메일 정규화와 비밀번호 규칙, RoomService의 인원 범위와 해시 저장, RoomPresenceService의 join/ready/leave 상태를 단위 테스트로 분리할 수 있습니다. 그다음 Spring Security 테스트로 로그인과 보호 URL을 확인하고, 마지막에 WebSocket 통합 테스트를 추가합니다.")
    add_code(doc, "단위 테스트 후보\n- 닉네임, 이메일, 비밀번호, 약관 검증\n- 방 제목, 최대 인원, 비밀번호 검증\n- 방 생성 시 game_room과 host member의 순서\n- presence join -> ready -> disconnect\n\n통합 테스트 후보\n- 회원가입 -> 로그인 -> /rooms 접근\n- 인증 사용자만 /rooms/new POST 가능\n- /ws 연결 후 chat과 presence destination 처리", "추천 테스트 목록")

    page_break(doc)
    h1(doc, "13. 핵심 용어 사전")
    add_table(doc, ["용어", "이 프로젝트에서의 뜻"], [
        ("Bean", "Spring이 생성하고 관리하는 객체. Controller, Service, Config 등이 해당합니다."),
        ("Dependency Injection", "객체가 필요한 Service나 Mapper를 생성자 매개변수로 받는 방식입니다."),
        ("Model", "Controller가 템플릿에 전달하는 이름과 값의 묶음입니다."),
        ("Thymeleaf", "HTML 안의 th:* 속성으로 서버 값을 화면에 넣는 템플릿 엔진입니다."),
        ("Domain", "사용자나 방처럼 애플리케이션의 핵심 데이터를 표현하는 객체입니다."),
        ("DTO", "특정 요청이나 응답의 데이터 모양을 표현하는 객체입니다."),
        ("Mapper", "Java 메서드 호출과 SQL 실행을 연결하는 MyBatis 인터페이스입니다."),
        ("Transaction", "여러 DB 작업을 하나의 성공 또는 실패 단위로 묶는 경계입니다."),
        ("Principal", "현재 요청이나 WebSocket 세션의 로그인 사용자입니다."),
        ("WebSocket", "브라우저와 서버가 연결을 유지한 채 양방향 통신하는 기술입니다."),
        ("STOMP", "메시지를 destination과 frame 형식으로 주고받는 프로토콜입니다."),
        ("Broker", "topic을 구독한 여러 사용자에게 메시지를 전달하는 중계기입니다."),
        ("Presence", "현재 연결된 참가자와 준비 상태 같은 실시간 접속 정보입니다."),
        ("BCrypt", "비밀번호 원문 대신 검증 가능한 해시를 저장하는 방식입니다."),
    ], widths=[4.2, 12.6], font_size=8.8)
    h2(doc, "마지막 복습 질문")
    add_bullets(doc, [
        "회원가입 POST가 AuthController로 들어간 뒤 실제 INSERT는 어느 파일에서 실행되는가?",
        "로그인 POST를 AuthController가 직접 처리하지 않는 이유는 무엇인가?",
        "RoomList.currentPlayers와 RoomPresenceState.participants의 차이는 무엇인가?",
        "채팅의 /app 목적지와 /topic 목적지는 각각 어느 방향의 메시지인가?",
        "준비 상태가 DB가 아니라 Map에 저장될 때 서버 재시작에서 어떤 일이 일어나는가?",
        "실제 게임 시작 기능을 추가하려면 먼저 어떤 상태 모델을 만들어야 하는가?",
    ])
    add_body(doc, "이 질문에 파일 이름과 메서드 이름으로 답할 수 있으면, 현재 MAFIAGAME 코드의 큰 흐름은 이미 이해한 것입니다. 다음 학습에서는 기능을 추가할 때마다 먼저 ‘어떤 상태가 영속 데이터이고 어떤 상태가 실시간 메모리인가’를 구분해 보세요.")

    # Document properties
    doc.core_properties.title = "MAFIAGAME 프로젝트 입문 강의서"
    doc.core_properties.subject = "현재 코드 기준 Spring Boot MVC와 WebSocket 데이터 흐름"
    doc.core_properties.author = "Codex"
    doc.core_properties.keywords = "MAFIAGAME, Spring Boot, MVC, Thymeleaf, MyBatis, WebSocket, STOMP"
    doc.save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
