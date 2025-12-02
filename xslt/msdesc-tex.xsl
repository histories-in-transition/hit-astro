<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
        xmlns:tei="http://www.tei-c.org/ns/1.0"
        xmlns:xs="http://www.w3.org/2001/XMLSchema"
        exclude-result-prefixes="tei xs"
        version="3.0">
        
        <xsl:output encoding="UTF-8" media-type="text" omit-xml-declaration="true" indent="no"/>
        
        <!-- Root template -->
        <xsl:template match="/">
                \documentclass{article}
                \usepackage[ngerman]{babel}
                \usepackage[utf8x]{inputenc}
                \setlength\parindent{0pt}
                \usepackage{hyperref}
                \usepackage{geometry}
                \geometry{
                a4paper,
                textwidth=150mm,
                left=40mm,
                top=40mm,
                }
                \usepackage{marginnote}
                \usepackage[strict]{changepage}
                \setlength{\parskip}{0.5em}
                \usepackage[markcase=noupper]{scrlayer-scrpage}
                \ohead{}
                \cfoot*{\pagemark}
                \reversemarginpar
                \setcounter{secnumdepth}{-1}
                
                \title{<xsl:apply-templates select=".//tei:titleStmt/tei:title"/>}
                \author{<xsl:apply-templates select=".//tei:titleStmt/tei:respStmt/tei:name"/>}
                \date{2025}
                
                \begin{document}
                \maketitle
                
                % Shelf mark and basic info
                \begin{adjustwidth}{-20pt}{}
                \textbf{<xsl:apply-templates select=".//tei:msDesc/tei:head/tei:title"/>}
                
                \smallskip
                <xsl:apply-templates select=".//tei:msDesc/tei:head/tei:note"/>
                \newline
                \end{adjustwidth}
                
                <!-- If NO codicological units, process top-level content -->
                <xsl:if test="not(.//tei:msDesc/tei:msPart)">
                        \leavevmode \marginnote{B:}<xsl:apply-templates select=".//tei:msDesc/tei:physDesc"/>
                        
                        \leavevmode \marginnote{S:} <xsl:apply-templates select=".//tei:msDesc/tei:physDesc/tei:objectDesc/tei:layoutDesc/tei:layout"></xsl:apply-templates>
                        
                        \leavevmode \marginnote{A:}<xsl:if test=".//tei:msDesc/tei:physDesc/tei:decoDesc">
                                <xsl:apply-templates select=".//tei:msDesc/tei:physDesc/tei:decoDesc"/>
                        </xsl:if>
                        
                        \leavevmode \marginnote{E:}<xsl:apply-templates select=".//tei:msDesc/tei:bindingDesc"/>
                        
                        \leavevmode \marginnote{G:}<xsl:apply-templates select=".//tei:msDesc/tei:history"/>
                        
                        \leavevmode \marginnote{Lit.:}<xsl:apply-templates select=".//tei:listBibl[@type='bibliography']"/>
                        
                        \begin{adjustwidth}{-20pt}{}
                        \section{Inhaltsverzeichnis}
                        \\[0.5\baselineskip]
                        \end{adjustwidth}
                        
                        <xsl:apply-templates select=".//tei:msDesc/tei:msContents"/>
                </xsl:if>
                
                <!-- If manuscript HAS codicological units, process each separately -->
                <xsl:if test=".//tei:msDesc/tei:msPart">
                        \leavevmode \marginnote{B:}<xsl:value-of select=".//tei:msDesc/tei:physDesc/tei:objectDesc/tei:supportDesc/tei:support/tei:material"/>
                        <xsl:apply-templates select=".//tei:msDesc/tei:physDesc/tei:objectDesc/tei:supportDesc/tei:collation"/>
                        <xsl:value-of select="normalize-space(tei:msDesc/tei:physDesc/tei:objectDesc/tei:supportDesc/tei:foliation)"/>
                        
                        \leavevmode \marginnote{S:} <xsl:apply-templates select=".//tei:msDesc/tei:physDesc/tei:objectDesc/tei:layoutDesc/tei:layout"></xsl:apply-templates>
                        
                        \leavevmode \marginnote{E:}<xsl:apply-templates select=".//tei:msDesc/tei:physDesc/tei:bindingDesc"/>
                        
                        \leavevmode \marginnote{G:}<xsl:apply-templates select=".//tei:msDesc/tei:history"/>
                        
                        \leavevmode \marginnote{Lit.:}<xsl:apply-templates select=".//tei:listBibl[@type='bibliography']"/>
                        
                        <!-- Process each codicological unit -->
                        <xsl:for-each select=".//tei:msDesc/tei:msPart">
                                \begin{adjustwidth}{-20pt}{}
                                \section{<xsl:value-of select="./tei:msIdentifier/tei:idno"/>}
                                \\[0.5\baselineskip]
                                \end{adjustwidth}
                                
                                <!-- Physical description for this unit -->
                                <xsl:if test="./tei:support or ./tei:extent or ./tei:collation">
                                        \leavevmode \marginnote{B:}<xsl:apply-templates select="./tei:physDesc"/>
                                </xsl:if>
                                
                                <!-- Decoration for this unit -->
                                <xsl:if test="./tei:physDesc/tei:decoDesc">
                                        \leavevmode \marginnote{A:}
                                        <xsl:apply-templates select="./tei:physDesc/tei:decoDesc"/>
                                </xsl:if>
                                
                                <!-- History for this unit -->
                                <xsl:if test="./tei:history">
                                        \leavevmode \marginnote{G:}
                                        <xsl:apply-templates select="./tei:history"/>
                                </xsl:if>
                                
                                <!-- Contents for this unit -->
                                \begin{adjustwidth}{-20pt}{}
                                \subsection{Inhaltsverzeichnis}
                                \\[0.5\baselineskip]
                                \end{adjustwidth}
                                
                                <xsl:apply-templates select="./tei:msContents"/>
                        </xsl:for-each>
                </xsl:if>
                
                \end{document}
        </xsl:template>
        
        <!-- Manuscript Identifier -->
        <xsl:template match="tei:msIdentifier">
                <xsl:value-of select="tei:settlement"/>, <xsl:value-of select="tei:repository"/>, <xsl:value-of select="tei:idno"/>
        </xsl:template>
        
        <!-- Physical Description -->
        <xsl:template match="tei:physDesc">
                <xsl:apply-templates select=".//tei:supportDesc"/>
                <xsl:apply-templates select=".//tei:collation"/>
                \\[0.5\baselineskip]
        </xsl:template>
        <xsl:template match="tei:layoutDesc">
                <xsl:apply-templates select=".//tei:p"/>
        </xsl:template>
        
        <!-- Support Description (material, extent, foliation) -->
        <xsl:template match="tei:supportDesc">
                <xsl:value-of select=".//tei:material"/>,
                <xsl:if test="tei:dimensions[@type='leaf']"><xsl:value-of select=".//tei:dimensions/tei:height"/>×<xsl:value-of select=".//tei:dimensions/tei:width"/> mm,</xsl:if>
                
        </xsl:template>       
       
        
        <!-- Layout / Schriftspiegel Description -->
        <xsl:template match="tei:layoutDesc">
                <xsl:for-each select="tei:layout/tei:p">
                   <xsl:apply-templates/>
                </xsl:for-each>
                Material: <xsl:value-of select=".//tei:material"/>, \\
                Umfang: <xsl:value-of select=".//tei:extent/tei:measure[@type='leavesCount']"/>, \\
                Maße: <xsl:value-of select=".//tei:dimensions/tei:height"/>×<xsl:value-of select=".//tei:dimensions/tei:width"/> mm, \\
                <xsl:if test=".//tei:foliation">
                        Foliierung: <xsl:value-of select=".//tei:foliation"/>, \\
                </xsl:if>
        </xsl:template>
        
        <!-- Decoration Description -->
        <xsl:template match="tei:decoDesc">
                <xsl:for-each select=".//tei:decoNote">
                       \par <xsl:value-of select="."/>
                </xsl:for-each>
                \\[0.5\baselineskip]
        </xsl:template>
        
        <!-- Binding Description -->
        
        <xsl:template match="tei:bindingDesc">
                <xsl:for-each select="./tei:binding">
                        <xsl:variable name="dateBinding">
                                <xsl:choose>
                                        <xsl:when test="@notBefore and @notAfter">Datierung <xsl:value-of select="@notBefore"/>-<xsl:value-of select="@notAfter"/>.</xsl:when>
                                        <xsl:when test="@notBefore">Datierung nach <xsl:value-of select="@notBefore"/>.</xsl:when>
                                        <xsl:when test="@notAfter">Datierung vor <xsl:value-of select="@notAfter"/>.</xsl:when>
                                        <xsl:when test="@when">Datierung <xsl:value-of select="@when"/>.</xsl:when>
                                </xsl:choose>
                        </xsl:variable><xsl:value-of select="./tei:p"/> <xsl:value-of select="$dateBinding"/> \\
                </xsl:for-each>
                \\[0.5\baselineskip]
        </xsl:template>
        
        <!-- History / Origin / Provenance -->
        <xsl:template match="tei:history">
                <xsl:if test=".//tei:summary"><xsl:value-of select=".//tei:summary"/>
                </xsl:if>                
                <xsl:if test=".//tei:origin">
                        \par\textbf{Entstehung:}
                        <xsl:if test=".//tei:origDate"><xsl:value-of select=".//tei:origDate[1]"/>
                        </xsl:if>
                        <xsl:if test=".//tei:origPlace">
                                <xsl:value-of select=".//tei:origPlace"/>
                        </xsl:if>
                </xsl:if>                
                <xsl:if test=".//tei:provenance">
                        \par\textbf{Provenienz:} <xsl:value-of select=".//tei:provenance//tei:orgName"/>
                </xsl:if>
                \\[0.5\baselineskip]
        </xsl:template>
        
        <!-- Bibliography -->
        <xsl:template match="tei:listBibl[@type='bibliography']">
                <xsl:for-each select=".//tei:bibl">
                        <xsl:value-of select="./tei:author"/>, \textit{<xsl:value-of select="./tei:title"/>}. \\
                </xsl:for-each>
                \\[0.5\baselineskip]
        </xsl:template>
        
        <!-- Contents Section -->
        <xsl:template match="tei:msContents">
                <xsl:if test=".//tei:summary">
                        \textbf{Zusammenfassung:} \\
                        <xsl:value-of select=".//tei:summary"/>\\[0.5\baselineskip]
                </xsl:if>
                
                <xsl:apply-templates select=".//tei:msItem"/>
        </xsl:template>
        
        <!-- Manuscript Item -->
        <xsl:template match="tei:msItem"><xsl:variable name="locus"><xsl:choose><xsl:when test="./tei:locusGrp"><xsl:value-of select="string-join(./tei:locusGrp/tei:locus/text(), ', ')"/></xsl:when><xsl:when test="./tei:locus"><xsl:value-of select="./tei:locus/text()"/></xsl:when></xsl:choose></xsl:variable><xsl:if test="$locus != ''">\leavevmode \marginnote{<xsl:value-of select="$locus"/>} </xsl:if>\textsc{<xsl:if test="./tei:author"><xsl:value-of select="./tei:author"/>: </xsl:if><xsl:value-of select="./tei:title"/>}<xsl:if test="./tei:textLang"> (<xsl:value-of select="normalize-space(./tei:textLang)"/>)</xsl:if><xsl:if test="./tei:rubric"> Üb. \textit{<xsl:value-of select="./tei:rubric"/>}</xsl:if><xsl:if test="./tei:incipit"> Inc. \textit{<xsl:value-of select="./tei:incipit"/>}</xsl:if><xsl:if test="./tei:explicit"> Expl. \textit{<xsl:value-of select="./tei:explicit"/>}</xsl:if><xsl:if test="./tei:note"> Bemerkung: <xsl:value-of select="./tei:note"/></xsl:if> \\[0.3\baselineskip]
        </xsl:template>
        
        <!-- Responsibility Statement -->
        <xsl:template match="tei:respStmt">
                <xsl:value-of select="./tei:resp"/>: <xsl:value-of select="./tei:name"/>
        </xsl:template>
        
        <!-- Text formatting templates -->
        <xsl:template match="tei:hi[@rend='sup']">\textsuperscript{<xsl:apply-templates/>}</xsl:template>
        
        <xsl:template match="tei:hi[@rend='italic']">\textit{<xsl:apply-templates/>}</xsl:template>
        
        <xsl:template match="tei:ref">\href{<xsl:value-of select="@target"/>}{<xsl:apply-templates/>}</xsl:template>
        
</xsl:stylesheet>
