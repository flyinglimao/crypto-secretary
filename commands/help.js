module.exports = function (chatId, message, send, { supportNetworks }) {
  const subHelp = message.split(" ");

  if (subHelp.length > 1) {
    switch (subHelp[1]) {
      case "watch":
        return send(
          chatId,
          `/watch command usage: /watch <address>[@<network>] [send|receive|approve]
There is a required parameter <address> and 3 optional parameters.
Required parameter <address> can be an address (0xabc...def).
Optional parameter @<network> is used when you only want to watch the addrsss for a chain, use '/help networks' to check accpets networks, default is all.
Optional parameter [send|receive|approve] is used when you only want to watch an event, accepts 'send', 'receive', or 'approve', default is all.`
          // Optional parameter [ft|nft] is used when you only want to watch FT (ERC20) or NFT (ERC721, ERC1155) events, accepts 'ft' or 'nft', default is both.
        );
      case "unwatch":
        return send(
          chatId,
          `/unwatch command usage: /watch <address>[@<network>] [send|receive|approve]
There is a required parameter <address> and 3 optional parameters.
If you didn't watch for some events, this command won't work.
Required parameter <address> can be an address (0xabc...def).
Optional parameter @<network> is used when you only want to unwatch the addrsss for a chain, use '/help networks' to check accpets networks, default is all.
Optional parameter [send|receive|approve] is used when you only want to unwatch an event, accepts 'send', 'receive', or 'approve', default is all.`
          // Optional parameter [ft|nft] is used when you only want to unwatch FT (ERC20) or NFT (ERC721, ERC1155) events, accepts 'ft' or 'nft', default is both.
        );
      case "shutup":
        return send(
          chatId,
          `/shutup command usage: /shutup <length>
There is a required parameter <length>
Required parameter <length> is the time length you want to mute.
If the unit wasn't specific, it will be assumed as seconds.
Units can be used include: second(s) minute(s) hour(s) day(s)
Example: /shutup 1 day`
        );
      case "networks":
        return send(chatId, Object.keys(supportNetworks).join(", "));
    }
    return send(chatId, "Cannot find the command");
  } else {
    return send(
      chatId,
      `There are some commands can be used:
* Watch some event for an address: /watch <address>[@<network>] [ft|nft] [send|receive|approve]
* Unwatch some event for an address: /unwatch <address>[@<network>] [ft|nft] [send|receive|approve]
* Mute the bot for a while: /shutup <length>
* Get helps for a command: /help <command>

You can use command like '/help shutup'. Note that /help is disabled in group and channels.`
    );
  }
};
