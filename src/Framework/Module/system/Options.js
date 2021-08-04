import gpio from "gpio"

const Options = {
    SERVER_CONFIG : {},
    SERVER_STATE_DEVELOPMENT : "dev",
    SERVER_STATE_PRODUCTION : "prod",
    HTTP2_CORE_ENGINE : 1,
    EXPRESS_CORE_ENGINE : 2,
    FASTIFY_CORE_ENGINE : 3,
    RESTIFY_CORE_ENGINE : 4,
    REACTJS_CORE_ENGINE : 5,
    VIEW_POV_EJS : 1,
    VIEW_POV_MUSTACHE : 2,
    HOST_LOCALHOST : 1,
    FIREWALL_NAT_SRC : "srcnat",
    FIREWALL_NAT_DST : "dstnat",
    MARIADB_TYPE_DATA_BIGINT : "BIGINT",
    MARIADB_TYPE_DATA_LONGTEXT : "LONGTEXT",
    MARIADB_OPT_AUTO_INCREMENT : "AUTO_INCREMENT",
    MARIADB_OPT_AUTO_PRIMARY_KEY : "PRIMARY KEY",
    GPIO_DIR_OUT : gpio.DIRECTION.OUT,
    GPIO_DIR_IN : gpio.DIRECTION.IN,
    GPIO_EVENT_CHANGE : "change",
    ESCPOS_TYPE_USB : 1,
    ESCPOS_TYPE_NETWORK : 2,
    ESCPOS_TYPE_SERIAL : 3
}

export default Options;