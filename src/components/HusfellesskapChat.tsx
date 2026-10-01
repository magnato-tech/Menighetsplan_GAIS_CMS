import React from "react";
import { GroupChat } from "./GroupChat";

export { GroupChat };
export const HusfellesskapChat: React.FC<{ groupId?: string }> = (props) => {
  return <GroupChat {...props} />;
};
