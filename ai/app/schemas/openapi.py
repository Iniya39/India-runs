"""Helpers for exposing schema-only models in the generated OpenAPI document."""

from pydantic import BaseModel


def register_schemas(openapi_schema: dict, models: list[type[BaseModel]]) -> None:
    """
    Merge Pydantic model JSON schemas into an OpenAPI components/schemas section
    so models appear in Swagger before their routes are implemented.
    """
    components = openapi_schema.setdefault("components", {})
    schemas = components.setdefault("schemas", {})

    for model in models:
        json_schema = model.model_json_schema(
            ref_template="#/components/schemas/{model}"
        )
        defs = json_schema.pop("$defs", {})
        for def_name, def_schema in defs.items():
            schemas[def_name] = def_schema
        schemas[model.__name__] = json_schema
