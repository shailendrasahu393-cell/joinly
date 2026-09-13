from pydantic import BaseModel

class JoinRequestAction(BaseModel):
    action: str # "accept" or "decline"
