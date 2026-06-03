-- =============================================================
-- Script de creación de base de datos: KahootCloneDB
-- Motor: SQL Server (compatible con SQL Server 2016+)
-- Ejecutar en: SQL Server Management Studio (SSMS)
-- =============================================================

-- Eliminar la base de datos si ya existe (solo en entorno de desarrollo)
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'tiusr15pl_KahootCloneDB')
BEGIN
    ALTER DATABASE tiusr15pl_KahootCloneDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE tiusr15pl_KahootCloneDB;
    PRINT 'Base de datos KahootCloneDB eliminada.'
END
GO

-- Crear la base de datos
CREATE DATABASE tiusr15pl_KahootCloneDB
    COLLATE Latin1_General_CI_AS;
GO

USE tiusr15pl_KahootCloneDB;
GO

PRINT 'Creando tablas...';
GO

-- =============================================================
-- TABLA: Administradores
-- Almacena los usuarios administradores que crean Kahoots
-- =============================================================
CREATE TABLE Administradores (
    IdAdministrador INT IDENTITY(1,1)    PRIMARY KEY,
    Nombre          NVARCHAR(100)        NOT NULL,
    Email           NVARCHAR(150)        NOT NULL UNIQUE,
    Usuario         NVARCHAR(50)         NOT NULL UNIQUE,
    Contrasena      NVARCHAR(255)        NOT NULL,
    FechaCreacion   DATETIME             NOT NULL DEFAULT GETDATE(),
    CONSTRAINT CK_Admin_Email CHECK (Email LIKE '%@%.%')
);
GO

-- =============================================================
-- TABLA: Kahoots
-- Almacena los tests/quizzes creados por administradores
-- =============================================================
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
GO

-- =============================================================
-- TABLA: Preguntas
-- Almacena las preguntas de cada Kahoot en orden
-- =============================================================
CREATE TABLE Preguntas (
    IdPregunta          INT IDENTITY(1,1)    PRIMARY KEY,
    IdKahoot            INT                  NOT NULL,
    TextoPregunta       NVARCHAR(500)        NOT NULL,
    TiempoLimiteSegundos INT                 NOT NULL DEFAULT 20,
    OrdenPregunta       INT                  NOT NULL,
    CONSTRAINT FK_Preguntas_Kahoots
        FOREIGN KEY (IdKahoot) REFERENCES Kahoots(IdKahoot),
    CONSTRAINT CK_Pregunta_Tiempo CHECK (TiempoLimiteSegundos BETWEEN 5 AND 120),
    CONSTRAINT CK_Pregunta_Orden CHECK (OrdenPregunta > 0)
);
GO

-- =============================================================
-- TABLA: OpcionesRespuesta
-- Almacena las 4 opciones por pregunta con su figura asociada
-- =============================================================
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
GO

-- =============================================================
-- TABLA: SesionesJuego
-- Almacena cada partida/sesión de juego iniciada
-- =============================================================
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
GO

-- =============================================================
-- TABLA: Participantes
-- Almacena los jugadores que se unen a cada sesión
-- =============================================================
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
GO

-- =============================================================
-- TABLA: RespuestasParticipantes
-- Registro detallado de cada respuesta enviada durante el juego
-- =============================================================
CREATE TABLE RespuestasParticipantes (
    IdRespuesta         INT IDENTITY(1,1)    PRIMARY KEY,
    IdParticipante      INT                  NOT NULL,
    IdSesion            INT                  NOT NULL,
    IdPregunta          INT                  NOT NULL,
    IdOpcionSeleccionada INT                 NULL,  -- NULL si no respondió a tiempo
    EsCorrecta          BIT                  NOT NULL DEFAULT 0,
    TiempoRespuestaMs   INT                  NULL,
    PuntajeObtenido     INT                  NOT NULL DEFAULT 0,
    FechaRespuesta      DATETIME             NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Respuestas_Participantes
        FOREIGN KEY (IdParticipante) REFERENCES Participantes(IdParticipante),
    CONSTRAINT FK_Respuestas_Sesiones
        FOREIGN KEY (IdSesion) REFERENCES SesionesJuego(IdSesion),
    CONSTRAINT FK_Respuestas_Preguntas
        FOREIGN KEY (IdPregunta) REFERENCES Preguntas(IdPregunta),
    CONSTRAINT FK_Respuestas_Opciones
        FOREIGN KEY (IdOpcionSeleccionada) REFERENCES OpcionesRespuesta(IdOpcion),
    CONSTRAINT CK_Respuesta_Puntaje CHECK (PuntajeObtenido >= 0),
    CONSTRAINT CK_Respuesta_Tiempo CHECK (TiempoRespuestaMs IS NULL OR TiempoRespuestaMs >= 0)
);
GO

-- =============================================================
-- TABLA: ResultadosFinales
-- Ranking final al terminar cada sesión de juego
-- =============================================================
CREATE TABLE ResultadosFinales (
    IdResultado                 INT IDENTITY(1,1)    PRIMARY KEY,
    IdSesion                    INT                  NOT NULL,
    IdParticipante              INT                  NOT NULL,
    Posicion                    INT                  NOT NULL,
    PuntajeTotal                INT                  NOT NULL DEFAULT 0,
    RespuestasCorrectas         INT                  NOT NULL DEFAULT 0,
    RespuestasIncorrectas       INT                  NOT NULL DEFAULT 0,
    TiempoPromedioRespuestaMs   INT                  NOT NULL DEFAULT 0,
    FechaResultado              DATETIME             NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Resultados_Sesiones
        FOREIGN KEY (IdSesion) REFERENCES SesionesJuego(IdSesion),
    CONSTRAINT FK_Resultados_Participantes
        FOREIGN KEY (IdParticipante) REFERENCES Participantes(IdParticipante),
    CONSTRAINT CK_Resultado_Posicion CHECK (Posicion > 0),
    CONSTRAINT UQ_Resultado_SesionParticipante UNIQUE (IdSesion, IdParticipante)
);
GO

-- =============================================================
-- ÍNDICES para mejorar el rendimiento en consultas frecuentes
-- =============================================================
CREATE INDEX IX_SesionesJuego_CodigoSesion   ON SesionesJuego(CodigoSesion);
CREATE INDEX IX_Participantes_IdSesion        ON Participantes(IdSesion);
CREATE INDEX IX_Participantes_Nombre          ON Participantes(NombreParticipante);
CREATE INDEX IX_Respuestas_IdSesion           ON RespuestasParticipantes(IdSesion);
CREATE INDEX IX_Respuestas_IdParticipante     ON RespuestasParticipantes(IdParticipante);
CREATE INDEX IX_Preguntas_IdKahoot            ON Preguntas(IdKahoot);
CREATE INDEX IX_Opciones_IdPregunta           ON OpcionesRespuesta(IdPregunta);
CREATE INDEX IX_Resultados_IdSesion           ON ResultadosFinales(IdSesion);
GO

PRINT 'Tablas e índices creados correctamente.';
GO

-- =============================================================
-- DATOS DE PRUEBA
-- =============================================================

-- Administrador de ejemplo
INSERT INTO Administradores (Nombre, Email, Usuario, Contrasena)
VALUES ('Administrador Demo', 'admin@kahootclone.com', 'admin', 'admin123');
GO

-- Kahoot de ejemplo: Quiz de Geografía
INSERT INTO Kahoots (IdAdministrador, Titulo, Descripcion)
VALUES (1, 'Quiz de Geografía', 'Preguntas básicas sobre geografía mundial');
GO

-- Preguntas del Kahoot
INSERT INTO Preguntas (IdKahoot, TextoPregunta, TiempoLimiteSegundos, OrdenPregunta)
VALUES
    (1, '¿Cuál es la capital de Francia?', 20, 1),
    (1, '¿En qué continente se encuentra Brasil?', 15, 2),
    (1, '¿Cuál es el océano más grande del mundo?', 20, 3);
GO

-- Opciones para Pregunta 1 (IdPregunta = 1): Capital de Francia
INSERT INTO OpcionesRespuesta (IdPregunta, TextoOpcion, Figura, EsCorrecta)
VALUES
    (1, 'Madrid',  'Triangulo', 0),
    (1, 'París',   'Circulo',   1),  -- Respuesta correcta
    (1, 'Londres', 'Cuadrado',  0),
    (1, 'Roma',    'Rombo',     0);
GO

-- Opciones para Pregunta 2 (IdPregunta = 2): Continente de Brasil
INSERT INTO OpcionesRespuesta (IdPregunta, TextoOpcion, Figura, EsCorrecta)
VALUES
    (2, 'Europa',           'Triangulo', 0),
    (2, 'África',           'Circulo',   0),
    (2, 'América del Sur',  'Cuadrado',  1),  -- Respuesta correcta
    (2, 'Asia',             'Rombo',     0);
GO

-- Opciones para Pregunta 3 (IdPregunta = 3): Océano más grande
INSERT INTO OpcionesRespuesta (IdPregunta, TextoOpcion, Figura, EsCorrecta)
VALUES
    (3, 'Océano Atlántico', 'Triangulo', 0),
    (3, 'Océano Índico',    'Circulo',   0),
    (3, 'Océano Ártico',    'Cuadrado',  0),
    (3, 'Océano Pacífico',  'Rombo',     1);  -- Respuesta correcta
GO

-- Sesión de juego de ejemplo (ya finalizada)
INSERT INTO SesionesJuego (IdKahoot, CodigoSesion, EstadoSesion, PreguntaActual, FechaFin)
VALUES (1, '123456', 'finished', 3, GETDATE());
GO

-- Participantes de ejemplo
INSERT INTO Participantes (IdSesion, NombreParticipante, SocketId, PuntajeTotal)
VALUES
    (1, 'Juan García',   'socket-001', 2800),
    (1, 'María López',   'socket-002', 1715),
    (1, 'Carlos Pérez',  'socket-003', 800);
GO

-- Respuestas de los participantes
-- Juan: 3/3 correctas
INSERT INTO RespuestasParticipantes (IdParticipante, IdSesion, IdPregunta, IdOpcionSeleccionada, EsCorrecta, TiempoRespuestaMs, PuntajeObtenido)
VALUES
    (1, 1, 1, 2,  1, 3200, 950),
    (1, 1, 2, 7,  1, 2800, 975),
    (1, 1, 3, 12, 1, 4100, 875);
GO

-- María: 2/3 correctas
INSERT INTO RespuestasParticipantes (IdParticipante, IdSesion, IdPregunta, IdOpcionSeleccionada, EsCorrecta, TiempoRespuestaMs, PuntajeObtenido)
VALUES
    (2, 1, 1, 2,  1, 5100, 875),
    (2, 1, 2, 7,  1, 6200, 840),
    (2, 1, 3, 10, 0, 3800, 0);   -- Incorrecta (Océano Índico)
GO

-- Carlos: 1/3 correctas
INSERT INTO RespuestasParticipantes (IdParticipante, IdSesion, IdPregunta, IdOpcionSeleccionada, EsCorrecta, TiempoRespuestaMs, PuntajeObtenido)
VALUES
    (3, 1, 1, 1,  0, 4500, 0),   -- Incorrecta (Madrid)
    (3, 1, 2, 7,  1, 8500, 800),
    (3, 1, 3, 11, 0, 5200, 0);   -- Incorrecta (Océano Ártico)
GO

-- Resultados finales de la sesión de ejemplo
INSERT INTO ResultadosFinales (IdSesion, IdParticipante, Posicion, PuntajeTotal, RespuestasCorrectas, RespuestasIncorrectas, TiempoPromedioRespuestaMs)
VALUES
    (1, 1, 1, 2800, 3, 0, 3367),
    (1, 2, 2, 1715, 2, 1, 5033),
    (1, 3, 3, 800,  1, 2, 6067);
GO

PRINT '================================================';
PRINT 'Base de datos KahootCloneDB creada exitosamente';
PRINT 'Datos de prueba insertados correctamente';
PRINT '================================================';
GO
