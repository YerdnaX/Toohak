-- =============================================================
-- Script de configuración de base de datos: tiusr15pl_KahootCloneDB
-- SEGURO PARA RE-EJECUTAR: usa IF NOT EXISTS en todas las operaciones
-- Motor: SQL Server 2016+
-- Ejecutar en: SQL Server Management Studio (SSMS) conectado al servidor de Plesk
-- =============================================================

USE tiusr15pl_KahootCloneDB;
GO

-- =============================================================
-- TABLA: Administradores
-- =============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Administradores')
BEGIN
    CREATE TABLE Administradores (
        IdAdministrador INT IDENTITY(1,1)    PRIMARY KEY,
        Nombre          NVARCHAR(100)        NOT NULL,
        Email           NVARCHAR(150)        NOT NULL UNIQUE,
        Usuario         NVARCHAR(50)         NOT NULL UNIQUE,
        Contrasena      NVARCHAR(255)        NOT NULL,
        FechaCreacion   DATETIME             NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Tabla Administradores creada.';
END
GO

-- =============================================================
-- TABLA: Kahoots
-- =============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Kahoots')
BEGIN
    CREATE TABLE Kahoots (
        IdKahoot        INT IDENTITY(1,1)    PRIMARY KEY,
        IdAdministrador INT                  NOT NULL,
        Titulo          NVARCHAR(200)        NOT NULL,
        Descripcion     NVARCHAR(500)        NULL,
        FechaCreacion   DATETIME             NOT NULL DEFAULT GETDATE(),
        Estado          NVARCHAR(20)         NOT NULL DEFAULT 'activo',
        CONSTRAINT FK_Kahoots_Administradores
            FOREIGN KEY (IdAdministrador) REFERENCES Administradores(IdAdministrador),
        CONSTRAINT CK_Kahoot_Estado CHECK (Estado IN ('activo', 'inactivo', 'archivado'))
    );
    PRINT 'Tabla Kahoots creada.';
END
GO

-- =============================================================
-- TABLA: Preguntas
-- =============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Preguntas')
BEGIN
    CREATE TABLE Preguntas (
        IdPregunta           INT IDENTITY(1,1)    PRIMARY KEY,
        IdKahoot             INT                  NOT NULL,
        TextoPregunta        NVARCHAR(500)        NOT NULL,
        TiempoLimiteSegundos INT                  NOT NULL DEFAULT 20,
        OrdenPregunta        INT                  NOT NULL,
        CONSTRAINT FK_Preguntas_Kahoots
            FOREIGN KEY (IdKahoot) REFERENCES Kahoots(IdKahoot),
        CONSTRAINT CK_Pregunta_Tiempo CHECK (TiempoLimiteSegundos BETWEEN 5 AND 120),
        CONSTRAINT CK_Pregunta_Orden CHECK (OrdenPregunta > 0)
    );
    PRINT 'Tabla Preguntas creada.';
END
GO

-- =============================================================
-- TABLA: OpcionesRespuesta
-- Nota: Figura usa primera letra mayúscula (Triangulo, Circulo, etc.)
-- El código Node.js convierte automáticamente al insertar/leer.
-- =============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'OpcionesRespuesta')
BEGIN
    CREATE TABLE OpcionesRespuesta (
        IdOpcion    INT IDENTITY(1,1)    PRIMARY KEY,
        IdPregunta  INT                  NOT NULL,
        TextoOpcion NVARCHAR(300)        NOT NULL,
        Figura      NVARCHAR(20)         NOT NULL,
        EsCorrecta  BIT                  NOT NULL DEFAULT 0,
        CONSTRAINT FK_Opciones_Preguntas
            FOREIGN KEY (IdPregunta) REFERENCES Preguntas(IdPregunta),
        CONSTRAINT CK_Opcion_Figura CHECK (Figura IN ('Triangulo', 'Circulo', 'Cuadrado', 'Rombo'))
    );
    PRINT 'Tabla OpcionesRespuesta creada.';
END
GO

-- =============================================================
-- TABLA: SesionesJuego
-- =============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SesionesJuego')
BEGIN
    CREATE TABLE SesionesJuego (
        IdSesion        INT IDENTITY(1,1)    PRIMARY KEY,
        IdKahoot        INT                  NOT NULL,
        CodigoSesion    NVARCHAR(10)         NOT NULL UNIQUE,
        EstadoSesion    NVARCHAR(20)         NOT NULL DEFAULT 'waiting',
        PreguntaActual  INT                  NOT NULL DEFAULT -1,
        FechaInicio     DATETIME             NOT NULL DEFAULT GETDATE(),
        FechaFin        DATETIME             NULL,
        CONSTRAINT FK_Sesiones_Kahoots
            FOREIGN KEY (IdKahoot) REFERENCES Kahoots(IdKahoot),
        CONSTRAINT CK_Sesion_Estado
            CHECK (EstadoSesion IN ('waiting', 'active', 'question-results', 'finished'))
    );
    PRINT 'Tabla SesionesJuego creada.';
END
GO

-- =============================================================
-- TABLA: Participantes
-- =============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Participantes')
BEGIN
    CREATE TABLE Participantes (
        IdParticipante      INT IDENTITY(1,1)    PRIMARY KEY,
        IdSesion            INT                  NOT NULL,
        NombreParticipante  NVARCHAR(100)        NOT NULL,
        SocketId            NVARCHAR(100)        NULL,
        FechaIngreso        DATETIME             NOT NULL DEFAULT GETDATE(),
        PuntajeTotal        INT                  NOT NULL DEFAULT 0,
        CONSTRAINT FK_Participantes_Sesiones
            FOREIGN KEY (IdSesion) REFERENCES SesionesJuego(IdSesion),
        CONSTRAINT CK_Participante_Puntaje CHECK (PuntajeTotal >= 0)
    );
    PRINT 'Tabla Participantes creada.';
END
GO

-- =============================================================
-- TABLA: RespuestasParticipantes
-- =============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'RespuestasParticipantes')
BEGIN
    CREATE TABLE RespuestasParticipantes (
        IdRespuesta          INT IDENTITY(1,1)    PRIMARY KEY,
        IdParticipante       INT                  NOT NULL,
        IdSesion             INT                  NOT NULL,
        IdPregunta           INT                  NOT NULL,
        IdOpcionSeleccionada INT                  NULL,
        EsCorrecta           BIT                  NOT NULL DEFAULT 0,
        TiempoRespuestaMs    INT                  NULL,
        PuntajeObtenido      INT                  NOT NULL DEFAULT 0,
        FechaRespuesta       DATETIME             NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_Respuestas_Participantes
            FOREIGN KEY (IdParticipante) REFERENCES Participantes(IdParticipante),
        CONSTRAINT FK_Respuestas_Sesiones
            FOREIGN KEY (IdSesion) REFERENCES SesionesJuego(IdSesion),
        CONSTRAINT FK_Respuestas_Preguntas
            FOREIGN KEY (IdPregunta) REFERENCES Preguntas(IdPregunta),
        CONSTRAINT FK_Respuestas_Opciones
            FOREIGN KEY (IdOpcionSeleccionada) REFERENCES OpcionesRespuesta(IdOpcion),
        CONSTRAINT CK_Respuesta_Puntaje CHECK (PuntajeObtenido >= 0)
    );
    PRINT 'Tabla RespuestasParticipantes creada.';
END
GO

-- =============================================================
-- TABLA: ResultadosFinales
-- =============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ResultadosFinales')
BEGIN
    CREATE TABLE ResultadosFinales (
        IdResultado                INT IDENTITY(1,1)    PRIMARY KEY,
        IdSesion                   INT                  NOT NULL,
        IdParticipante             INT                  NOT NULL,
        Posicion                   INT                  NOT NULL,
        PuntajeTotal               INT                  NOT NULL DEFAULT 0,
        RespuestasCorrectas        INT                  NOT NULL DEFAULT 0,
        RespuestasIncorrectas      INT                  NOT NULL DEFAULT 0,
        TiempoPromedioRespuestaMs  INT                  NOT NULL DEFAULT 0,
        FechaResultado             DATETIME             NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_Resultados_Sesiones
            FOREIGN KEY (IdSesion) REFERENCES SesionesJuego(IdSesion),
        CONSTRAINT FK_Resultados_Participantes
            FOREIGN KEY (IdParticipante) REFERENCES Participantes(IdParticipante),
        CONSTRAINT CK_Resultado_Posicion CHECK (Posicion > 0),
        CONSTRAINT UQ_Resultado_SesionParticipante UNIQUE (IdSesion, IdParticipante)
    );
    PRINT 'Tabla ResultadosFinales creada.';
END
GO

-- =============================================================
-- ÍNDICES (solo si no existen)
-- =============================================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SesionesJuego_CodigoSesion')
    CREATE INDEX IX_SesionesJuego_CodigoSesion ON SesionesJuego(CodigoSesion);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Participantes_IdSesion')
    CREATE INDEX IX_Participantes_IdSesion ON Participantes(IdSesion);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Preguntas_IdKahoot')
    CREATE INDEX IX_Preguntas_IdKahoot ON Preguntas(IdKahoot);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Opciones_IdPregunta')
    CREATE INDEX IX_Opciones_IdPregunta ON OpcionesRespuesta(IdPregunta);
GO

-- =============================================================
-- ADMINISTRADOR POR DEFECTO (solo si no existe)
-- El código Node.js usa siempre IdAdministrador = 1
-- =============================================================
IF NOT EXISTS (SELECT 1 FROM Administradores WHERE IdAdministrador = 1)
BEGIN
    -- Forzar que el primer registro tenga IdAdministrador = 1
    SET IDENTITY_INSERT Administradores ON;
    INSERT INTO Administradores (IdAdministrador, Nombre, Email, Usuario, Contrasena)
    VALUES (1, 'Admin', 'admin@kahoot.local', 'Admin', '123456');
    SET IDENTITY_INSERT Administradores OFF;
    PRINT 'Administrador por defecto creado (IdAdministrador = 1).';
END
GO

PRINT '================================================';
PRINT 'Base de datos lista. Tablas verificadas/creadas.';
PRINT '================================================';
GO
