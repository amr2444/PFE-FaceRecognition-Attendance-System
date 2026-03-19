import logging
import os


LOG_LEVEL = os.getenv("FACE_LOG_LEVEL", "INFO").upper()


def configure_logging() -> None:
    if logging.getLogger().handlers:
        return

    logging.basicConfig(
        level=getattr(logging, LOG_LEVEL, logging.INFO),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


def get_logger(name: str) -> logging.Logger:
    configure_logging()
    return logging.getLogger(name)
